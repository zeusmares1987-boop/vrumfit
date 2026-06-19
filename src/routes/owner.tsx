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
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import logoV from "@/assets/logo-v.png";
import headerGym from "@/assets/header-gym.jpg";
import tileUsuarios from "@/assets/tile-usuarios.jpg";
import tileProfessores from "@/assets/tile-professores.jpg";
import tileAlunos from "@/assets/tile-alunos.jpg";
import tileLoja from "@/assets/tile-loja.jpg";
import tileProdutos from "@/assets/tile-produtos.jpg";
import tilePlanos from "@/assets/tile-planos.jpg";
import tileFinanceiro from "@/assets/tile-financeiro.jpg";
import tileExecucao from "@/assets/tile-execucao.jpg";
import tileAvisos from "@/assets/tile-avisos.jpg";
import tileArquivos from "@/assets/tile-arquivos.jpg";
import tileMais from "@/assets/tile-mais.jpg";

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
  { icon: Dumbbell, label: "Professores", hint: "Equipe e gestão", to: "/personais", bg: tileProfessores },
  { icon: User, label: "Alunos", hint: "Alunos e matrículas", to: "/alunos", bg: tileAlunos },
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
  const filteredSmall = smallTiles.filter((t) => (t.label + " " + t.hint).toLowerCase().includes(q));
  const filteredWide = wideTiles.filter((t) => (t.label + " " + t.hint).toLowerCase().includes(q));

  return (
    <AppShell>
      {/* Welcome */}
      <section className="relative">
        <div className="relative rounded-[18px] overflow-hidden">
          <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 pr-20 min-h-[88px]">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight">
              Bem-vindo, <span className="text-primary">{profile?.full_name?.split(" ")[0] ?? "Proprietário"}</span>
            </h1>
            <p className="mt-1 text-[12px] text-white/70">Controle total do seu negócio.</p>
            <img src={logoV} alt="" className="absolute right-3 top-1/2 -translate-y-1/2 size-12 opacity-90" />
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/55" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulos..."
            className="w-full h-12 rounded-2xl bg-black/60 border border-white/10 pl-12 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 transition"
          />
        </div>
        <button className="h-12 px-4 rounded-2xl border border-primary/40 text-primary font-semibold text-[12px] flex items-center gap-2 hover:bg-primary/10">
          <SlidersHorizontal className="size-[16px]" /> Filtros
        </button>
      </div>

      {/* Period chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {periods.map((p) => {
          const active = period === p.id;
          return (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap flex items-center gap-1.5 transition ${active ? "bg-primary/15 border border-primary text-primary" : "bg-transparent border border-white/12 text-white/75"}`}>
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

      {/* Receita */}
      <section className="mt-3 grid grid-cols-2 gap-2.5">
        <Metric icon={Wallet} label="Receita" value={counts?.receita ? brl(counts.receita) : "—"} sub="Total pago" />
        <Metric icon={CreditCard} label="Pendentes" value={counts?.pendentes ?? 0} sub="Faturas" />
      </section>

      {/* Modules header */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold tracking-tight flex items-center gap-2">
          <span className="inline-block w-[3px] h-5 bg-primary rounded-full" /> Módulos
        </h2>
        <button className="h-8 px-3 rounded-full border border-primary/40 text-primary text-[11px] font-semibold flex items-center gap-1.5 hover:bg-primary/10">
          <SlidersHorizontal className="size-3.5" /> Ordenar <ChevronDown className="size-3.5" />
        </button>
      </div>

      <section className="mt-3 grid grid-cols-3 gap-2">
        {filteredSmall.map((t) => <PhotoTile key={t.label} {...t} />)}
      </section>
      {filteredWide.length > 0 && (
        <section className="mt-2 grid grid-cols-2 gap-2">
          {filteredWide.map((t) => <PhotoTile key={t.label} {...t} wide />)}
        </section>
      )}
    </AppShell>
  );
}

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Metric({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub: string }) {
  const display = typeof value === "number" ? (value === 0 ? "—" : value.toString()) : value;
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3 flex flex-col gap-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary shrink-0">
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/85 truncate">{label}</p>
      </div>
      <p className="text-[22px] leading-none font-extrabold mt-1">{display}</p>
      <p className="text-[10px] text-white/50 -mt-0.5">{sub}</p>
    </div>
  );
}

function PhotoTile({ icon: Icon, label, hint, to, bg, wide }: Tile & { wide?: boolean }) {
  return (
    <Link to={to} className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition block ${wide ? "aspect-[16/9]" : "aspect-[5/6]"}`}>
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.15) 100%)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="relative h-full p-3 flex flex-col">
        <div className="size-9 rounded-xl border border-primary/50 bg-black/55 backdrop-blur-sm grid place-items-center text-primary">
          <Icon className="size-[16px]" />
        </div>
        <div className="mt-auto pr-5">
          <p className="text-[13px] font-extrabold leading-tight">{label}</p>
          <p className="text-[10px] text-white/65 leading-snug mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <ChevronRight className="absolute bottom-2.5 right-2.5 size-4 text-primary" />
      </div>
    </Link>
  );
}
