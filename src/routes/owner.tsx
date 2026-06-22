import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronRight,
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, LayoutGrid, Calendar,
} from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { StoredImage } from "@/components/StoredImage";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import tileUsuariosAsset from "@/assets/tile-usuarios.jpg.asset.json";
const tileUsuarios = tileUsuariosAsset.url;
import tileProfessoresAsset from "@/assets/tile-professores.jpg.asset.json";
const tileProfessores = tileProfessoresAsset.url;
import tileAlunosAsset from "@/assets/tile-alunos.jpg.asset.json";
const tileAlunos = tileAlunosAsset.url;
import tileLojaAsset from "@/assets/tile-loja.jpg.asset.json";
const tileLoja = tileLojaAsset.url;
import tileProdutosAsset from "@/assets/tile-produtos.jpg.asset.json";
const tileProdutos = tileProdutosAsset.url;
import tilePlanosAsset from "@/assets/tile-planos.jpg.asset.json";
const tilePlanos = tilePlanosAsset.url;
import tileFinanceiroAsset from "@/assets/tile-financeiro.jpg.asset.json";
const tileFinanceiro = tileFinanceiroAsset.url;
import tileExecucaoAsset from "@/assets/tile-execucao.jpg.asset.json";
const tileExecucao = tileExecucaoAsset.url;
import tileAvisosAsset from "@/assets/tile-avisos.jpg.asset.json";
const tileAvisos = tileAvisosAsset.url;
import tileArquivosAsset from "@/assets/tile-arquivos.jpg.asset.json";
const tileArquivos = tileArquivosAsset.url;
import tileMaisAsset from "@/assets/tile-mais.jpg.asset.json";
const tileMais = tileMaisAsset.url;

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Painel do Proprietário — VRUMFIT PERSONAL" },
      { name: "description", content: "Visão geral do seu negócio." },
    ],
  }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <OwnerPage />
    </RequireAuth>
  ),
});

type Tile = {
  icon: React.ComponentType<{ className?: string }>;
  label: string; hint: string; to: string; bg: string;
};

const smallTiles: Tile[] = [
  { icon: Users, label: "Usuários", hint: "Gerencie acessos e permissões", to: "/personais", bg: tileUsuarios },
  { icon: Dumbbell, label: "Área Professor", hint: "Ver como professor", to: "/trainer", bg: tileProfessores },
  { icon: User, label: "Área Aluno", hint: "Ver como aluno", to: "/student", bg: tileAlunos },
  { icon: ShoppingBag, label: "Loja", hint: "Sua loja integrada", to: "/loja", bg: tileLoja },
  { icon: Package, label: "Produtos", hint: "Catálogo e estoque", to: "/produtos", bg: tileProdutos },
  { icon: CreditCard, label: "Planos", hint: "Planos e assinaturas", to: "/planos", bg: tilePlanos },
  { icon: Wallet, label: "Financeiro", hint: "Receitas e relatórios", to: "/financeiro", bg: tileFinanceiro },
  { icon: Target, label: "Execução", hint: "Biblioteca de treinos", to: "/treinos", bg: tileExecucao },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos", bg: tileAvisos },
];
const wideTiles: Tile[] = [
  { icon: FolderOpen, label: "Arquivos", hint: "Documentos e downloads", to: "/arquivos", bg: tileArquivos },
  { icon: LayoutGrid, label: "Mais", hint: "Outras configurações", to: "/config", bg: tileMais },
];
const periods = [
  { id: "geral", label: "Visão geral", icon: LayoutGrid },
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Semana" },
  { id: "mes", label: "Mês" },
  { id: "custom", label: "Personalizado" },
];

function OwnerPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("geral");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [group, setGroup] = useState<"todos" | "gestao" | "vendas" | "operacao">("todos");
  const [sortAz, setSortAz] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ["owner-counts"],
    queryFn: async () => {
      const [profs, alunos, prods, invs] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "personal"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "aluno"),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("amount_cents,status"),
      ]);
      const invoices = invs.data ?? [];
      const receita = invoices.filter((i) => i.status === "pago").reduce((s, i) => s + (i.amount_cents ?? 0), 0);
      const pendentes = invoices.filter((i) => i.status === "pendente").length;
      return {
        professores: profs.count ?? 0,
        alunos: alunos.count ?? 0,
        produtos: prods.count ?? 0,
        receita,
        pendentes,
      };
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("profiles").select("full_name,avatar_url").eq("id", user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const q = query.toLowerCase();
  const tileGroup = (label: string) => {
    if (["Loja", "Produtos", "Planos", "Financeiro"].includes(label)) return "vendas";
    if (["Área Professor", "Área Aluno", "Execução", "Arquivos"].includes(label)) return "operacao";
    return "gestao";
  };
  const filterTiles = (tiles: Tile[]) => {
    const filtered = tiles.filter((t) => {
      const matchesText = (t.label + " " + t.hint).toLowerCase().includes(q);
      const matchesGroup = group === "todos" || tileGroup(t.label) === group;
      return matchesText && matchesGroup;
    });
    return sortAz ? filtered.sort((a, b) => a.label.localeCompare(b.label, "pt-BR")) : filtered;
  };
  const filteredSmall = filterTiles(smallTiles);
  const filteredWide = filterTiles(wideTiles);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? "Proprietário";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  

  const avatarUrl = (profile as { avatar_url?: string } | undefined)?.avatar_url;
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <AppShell>
      {/* Welcome — estilo MFit: saudação pequena + nome grande + avatar */}
      <section className="flex items-center gap-3 px-1 pt-1">
        <div className="size-12 rounded-full bg-white/[0.06] border border-white/10 overflow-hidden grid place-items-center shrink-0">
          {avatarUrl ? (
            <StoredImage src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px] font-bold text-primary">{initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-white/55 leading-tight">{greeting},</p>
          <h1 className="truncate text-[22px] font-extrabold leading-tight tracking-tight text-white">
            {firstName}
          </h1>
        </div>
      </section>

      {/* Search + filtros */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/55" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulos..."
            className="w-full h-12 rounded-2xl bg-black/60 border border-white/10 pl-12 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 focus:bg-black/75 transition"
          />
        </div>
        <button onClick={() => setShowFilters((v) => !v)} className={`h-12 px-4 rounded-2xl border text-[12px] font-semibold flex items-center gap-2 transition ${showFilters ? "bg-primary/15 border-primary text-primary" : "border-white/15 text-white/80 hover:border-primary/50 hover:text-primary"}`}>
          <SlidersHorizontal className="size-[16px]" /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {([
            ["todos", "Todos"],
            ["gestao", "Gestão"],
            ["vendas", "Vendas"],
            ["operacao", "Operação"],
          ] as const).map(([id, label]) => (
            <button key={id} onClick={() => setGroup(id)} className={`shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold border transition ${group === id ? "border-primary bg-primary/15 text-primary" : "border-white/12 text-white/70 hover:border-primary/40"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Period chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {periods.map((p) => {
          const active = period === p.id;
          return (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${active ? "bg-primary/15 border border-primary text-primary" : "bg-transparent border border-white/12 text-white/75 hover:border-primary/40"}`}>
              {p.id === "geral" ? <LayoutGrid className="size-3.5" /> : <Calendar className="size-3.5" />}
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Metric cards */}
      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <Metric icon={Users} label="Professores" value={counts?.professores ?? 0} sub="Ativos" />
        <Metric icon={User} label="Alunos" value={counts?.alunos ?? 0} sub="Ativos" />
        <Metric icon={ShoppingBag} label="Produtos" value={counts?.produtos ?? 0} sub="Cadastrados" />
      </section>

      <section className="mt-2.5 grid grid-cols-2 gap-2.5">
        <Metric icon={Wallet} label="Receita" value={counts?.receita ? brl(counts.receita) : "—"} sub="Total pago" highlight />
        <Metric icon={CreditCard} label="Pendentes" value={counts?.pendentes ?? 0} sub="Faturas" />
      </section>

      {/* Modules header */}
      <div className="mt-7 mb-3 flex items-center gap-2.5">
        <span className="inline-block w-1 h-5 bg-primary rounded-full" />
        <h2 className="text-[18px] font-black tracking-tight">Módulos</h2>
        <span className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
        <button onClick={() => setSortAz((v) => !v)} className="h-8 px-3 rounded-full border border-white/15 text-white/70 text-[11px] font-semibold flex items-center gap-1.5 hover:border-primary/50 hover:text-primary transition">
          <SlidersHorizontal className="size-3.5" /> {sortAz ? "A-Z" : "Padrão"} <ChevronDown className="size-3.5" />
        </button>
      </div>

      <section className="grid grid-cols-3 gap-2">
        {filteredSmall.map((t) => <PhotoTile key={t.label} {...t} />)}
      </section>
      {filteredWide.length > 0 && (
        <section className="mt-2 grid grid-cols-2 gap-2">
          {filteredWide.map((t) => <PhotoTile key={t.label} {...t} wide />)}
        </section>
      )}
      {filteredSmall.length === 0 && filteredWide.length === 0 && (
        <div className="mt-6 text-center py-10 text-white/50 text-sm">
          Nenhum módulo encontrado.
        </div>
      )}
    </AppShell>
  );
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Metric({
  icon: Icon, label, value, sub, highlight,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string; highlight?: boolean }) {
  const display = typeof value === "number" ? (value === 0 ? "—" : value.toString()) : value;
  return (
    <div className={`rounded-2xl border p-3.5 flex flex-col gap-1 backdrop-blur-md transition hover:border-primary/45 ${highlight ? "border-primary/40 bg-gradient-to-br from-primary/15 to-black/50" : "border-white/10 bg-gradient-to-br from-white/[0.04] to-black/40"}`}>
      <div className="flex items-center gap-2">
        <div className={`size-7 rounded-lg border grid place-items-center text-primary shrink-0 ${highlight ? "border-primary/60 bg-primary/20" : "border-primary/40 bg-primary/10"}`}>
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/85 truncate uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-[22px] leading-none font-black mt-1.5">{display}</p>
      <p className="text-[10px] text-white/50">{sub}</p>
    </div>
  );
}

function PhotoTile({ icon: Icon, label, hint, to, bg, wide }: Tile & { wide?: boolean }) {
  return (
    <Link to={to} className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/55 hover:translate-y-[-2px] hover:shadow-[0_12px_30px_-12px_rgba(255,120,30,0.55)] transition-all duration-200 block ${wide ? "aspect-[16/9]" : "aspect-[5/6]"}`}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover scale-100 group-hover:scale-[1.04] transition-transform duration-500" loading="lazy" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.65) 50%, rgba(0,0,0,0.2) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
      <div className="relative h-full p-3 flex flex-col">
        <div className="size-9 rounded-xl border border-primary/55 bg-black/55 backdrop-blur-sm grid place-items-center text-primary group-hover:bg-primary/20 transition">
          <Icon className="size-[16px]" />
        </div>
        <div className="mt-auto pr-5">
          <p className="text-[13px] font-extrabold leading-tight">{label}</p>
          <p className="text-[10px] text-white/65 leading-snug mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <ChevronRight className="absolute bottom-2.5 right-2.5 size-4 text-primary opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
      </div>
    </Link>
  );
}
