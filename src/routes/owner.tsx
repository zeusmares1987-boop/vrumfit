import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, Bell, Dumbbell, Apple, ClipboardList, LineChart, MessageSquare,
  ShoppingBag, Package, CreditCard, Wallet, FolderOpen, Megaphone,
  Users, UserCog, Settings, LifeBuoy, Home, BarChart3, User, LogOut,
} from "lucide-react";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Painel do Dono — VRUMFIT PERSONAL" },
      { name: "description", content: "Gestão completa da sua academia: alunos, personais, receita e módulos." },
    ],
  }),
  component: OwnerDashboard,
});

const tiles = [
  { icon: Dumbbell, label: "Treinos", hint: "Planilhas e prescrições" },
  { icon: Apple, label: "Dieta", hint: "Planos alimentares" },
  { icon: ClipboardList, label: "Avaliações", hint: "Bioimpedância e dobras" },
  { icon: LineChart, label: "Evolução", hint: "Gráficos e fotos" },
  { icon: MessageSquare, label: "Chat", hint: "Conversas ao vivo" },
  { icon: ShoppingBag, label: "Loja", hint: "Vendas e pedidos" },
  { icon: Package, label: "Produtos", hint: "Catálogo" },
  { icon: CreditCard, label: "Planos", hint: "Assinaturas" },
  { icon: Wallet, label: "Financeiro", hint: "Receita e despesas" },
  { icon: FolderOpen, label: "Arquivos", hint: "Documentos" },
  { icon: Megaphone, label: "Avisos", hint: "Comunicados" },
  { icon: Users, label: "Alunos", hint: "Base de alunos" },
  { icon: UserCog, label: "Personais", hint: "Equipe técnica" },
  { icon: Settings, label: "Config", hint: "Preferências" },
  { icon: LifeBuoy, label: "Suporte", hint: "Ajuda" },
];

const chips = ["Geral", "Treinos", "Alunos", "Personais", "Financeiro"];

function OwnerDashboard() {
  const navigate = useNavigate();
  const [name, setName] = useState("Rodrigo");
  const [activeChip, setActiveChip] = useState("Geral");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vrumfit:session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.email) setName(String(s.email).split("@")[0]);
      }
    } catch {}
  }, []);

  const logout = () => {
    window.localStorage.removeItem("vrumfit:session");
    navigate({ to: "/login" });
  };

  const filtered = tiles.filter((t) =>
    t.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="min-h-[100dvh] pb-[calc(96px+env(safe-area-inset-bottom))] font-display">
      {/* Top bar */}
      <header className="px-5 pt-[max(env(safe-area-inset-top),2.5rem)] pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            Painel do Dono
          </p>
          <h1 className="text-xl font-bold mt-1 capitalize">
            Olá, <span className="text-primary">{name}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="size-10 rounded-full glass grid place-items-center relative">
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
          </button>
          <button
            onClick={logout}
            className="size-10 rounded-full glass grid place-items-center"
            aria-label="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulo, aluno ou treino…"
            className="w-full glass rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Chips */}
      <div className="px-5 mt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setActiveChip(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                activeChip === c
                  ? "bg-primary text-primary-foreground"
                  : "glass text-muted-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <section className="px-5 mt-6 grid grid-cols-3 gap-3">
        <Metric label="Alunos" value="142" delta="+12%" positive />
        <Metric label="Personais" value="08" delta="+1" positive accent />
        <Metric label="Receita" value="R$ 28k" delta="+4%" positive />
      </section>

      {/* Featured */}
      <section className="px-5 mt-6">
        <div className="glass rounded-3xl p-5 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 size-40 rounded-full bg-primary/20 blur-3xl" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-semibold">
            Resumo de hoje
          </p>
          <h3 className="mt-2 text-2xl font-bold leading-tight">
            12 treinos prescritos<br />
            <span className="text-muted-foreground font-medium text-base">
              3 avaliações agendadas · 5 mensagens
            </span>
          </h3>
        </div>
      </section>

      {/* Modules */}
      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-semibold">
            Módulos
          </h2>
          <span className="text-[11px] text-muted-foreground">{filtered.length} itens</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((t) => (
            <Tile key={t.label} icon={t.icon} label={t.label} hint={t.hint} />
          ))}
        </div>
      </section>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2"
        style={{ background: "linear-gradient(to top, var(--background) 60%, transparent)" }}
      >
        <div className="glass rounded-2xl flex items-center justify-around py-2.5">
          <NavItem icon={Home} label="Início" active />
          <NavItem icon={BarChart3} label="Métricas" />
          <NavItem icon={MessageSquare} label="Chat" />
          <NavItem icon={User} label="Perfil" />
        </div>
      </nav>
    </div>
  );
}

function Metric({
  label, value, delta, positive, accent,
}: { label: string; value: string; delta: string; positive?: boolean; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl p-3.5 ${
        accent ? "bg-primary/10 border border-primary/30" : "glass"
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-xl font-extrabold ${accent ? "text-primary" : ""}`}>{value}</p>
      <p className={`text-[10px] font-mono mt-0.5 ${positive ? "text-success" : "text-muted-foreground"}`}>
        {delta}
      </p>
    </div>
  );
}

function Tile({
  icon: Icon, label, hint,
}: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <button className="group relative aspect-square glass rounded-2xl p-3 flex flex-col justify-between text-left overflow-hidden hover:border-primary/40 transition">
      <div className="size-9 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-[13px] font-semibold leading-tight">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
          {hint}
        </p>
      </div>
      <div className="absolute -right-6 -bottom-6 size-16 rounded-full bg-primary/0 group-hover:bg-primary/10 blur-xl transition" />
    </button>
  );
}

function NavItem({
  icon: Icon, label, active,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean }) {
  return (
    <button className={`flex flex-col items-center gap-0.5 px-3 ${active ? "text-primary" : "text-muted-foreground"}`}>
      <Icon className="size-5" />
      <span className="text-[9px] uppercase tracking-widest font-semibold">{label}</span>
    </button>
  );
}
