import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronRight,
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, LayoutGrid, Pencil,
  Home, ShoppingBag as ShopIcon, MoreHorizontal, LogOut,
  Calendar,
} from "lucide-react";
import logoV from "@/assets/logo-v.png";
import avatarOwner from "@/assets/avatar-owner.jpg";

export const Route = createFileRoute("/owner")({
  head: () => ({
    meta: [
      { title: "Dashboard do Proprietário — VRUMFIT PERSONAL" },
      { name: "description", content: "Visão geral do seu negócio: professores, alunos, produtos e módulos." },
    ],
  }),
  component: OwnerDashboard,
});

type Tile = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  to: string;
  wide?: boolean;
};

const tiles: Tile[] = [
  { icon: Users, label: "Usuários", hint: "Gerencie acessos", to: "/personais" },
  { icon: Dumbbell, label: "Professores", hint: "Equipe e gestão", to: "/personais" },
  { icon: User, label: "Alunos", hint: "Alunos e matrículas", to: "/alunos" },
  { icon: ShoppingBag, label: "Loja", hint: "Sua loja online", to: "/loja" },
  { icon: Package, label: "Produtos", hint: "Catálogo de produtos", to: "/produtos" },
  { icon: CreditCard, label: "Planos", hint: "Planos e assinaturas", to: "/planos" },
  { icon: Wallet, label: "Financeiro", hint: "Receitas e saídas", to: "/financeiro" },
  { icon: Target, label: "Execução", hint: "Metas e resultados", to: "/treinos" },
  { icon: Bell, label: "Avisos", hint: "Comunicados", to: "/avisos" },
  { icon: FolderOpen, label: "Arquivos", hint: "Documentos", to: "/arquivos", wide: true },
  { icon: LayoutGrid, label: "Mais", hint: "Outras configurações", to: "/config", wide: true },
];

const periods = [
  { id: "geral", label: "Visão geral", icon: LayoutGrid },
  { id: "hoje", label: "Hoje", icon: Calendar },
  { id: "semana", label: "Semana", icon: Calendar },
  { id: "mes", label: "Mês", icon: Calendar },
  { id: "custom", label: "Personalizado", icon: Calendar },
];

function OwnerDashboard() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("geral");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("vrumfit:session");
      if (!raw) navigate({ to: "/login" });
    } catch {}
  }, [navigate]);

  const logout = () => {
    window.localStorage.removeItem("vrumfit:session");
    navigate({ to: "/login" });
  };

  const filtered = tiles.filter((t) =>
    (t.label + " " + t.hint).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      className="min-h-[100dvh] pb-[calc(110px+env(safe-area-inset-bottom))] font-display text-white"
      style={{
        background:
          "radial-gradient(120% 50% at 50% -10%, color-mix(in oklab, var(--brand) 18%, transparent), transparent 60%), #050608",
      }}
    >
      {/* Decorative circuit lines top-right */}
      <svg
        className="absolute top-0 right-0 w-[60%] h-[180px] opacity-[0.18] pointer-events-none"
        viewBox="0 0 400 180"
        fill="none"
      >
        <path d="M0 40 L120 40 L160 80 L280 80 L320 40 L400 40" stroke="currentColor" className="text-primary" strokeWidth="1" />
        <path d="M0 110 L80 110 L120 70 L240 70 L280 110 L400 110" stroke="currentColor" className="text-primary" strokeWidth="1" />
        <circle cx="160" cy="80" r="3" className="fill-primary" />
        <circle cx="280" cy="80" r="3" className="fill-primary" />
        <circle cx="120" cy="70" r="3" className="fill-primary" />
      </svg>

      {/* Header */}
      <header className="relative px-5 pt-[max(env(safe-area-inset-top),2.5rem)] pb-2 flex items-start justify-between gap-3">
        <Link to="/owner" className="flex items-center gap-2">
          <img src={logoV} alt="" width={44} height={44} className="size-11 drop-shadow-[0_4px_12px_rgba(255,140,40,0.4)]" />
          <div className="leading-none">
            <div className="text-[20px] font-extrabold tracking-tight">
              <span className="text-white">Vrum</span>
              <span className="text-primary">Fit</span>
            </div>
            <div className="mt-1 text-[8px] tracking-[0.45em] text-primary/90 font-semibold">
              — PERSONAL —
            </div>
          </div>
        </Link>

        <button className="flex items-center gap-2.5 group" aria-label="Trocar de modo">
          <div className="relative">
            <img
              src={avatarOwner}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover border-2 border-primary/70"
            />
            <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 blur-[2px]" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-semibold leading-tight">Olá, Proprietário</p>
            <p className="text-[11px] text-primary/90 flex items-center gap-0.5 leading-tight">
              Modo gestor <ChevronDown className="size-3" />
            </p>
          </div>
        </button>
      </header>

      {/* Title */}
      <div className="relative px-5 mt-4">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          Dashboard do Proprietário
        </h1>
        <div className="mt-1.5 h-[3px] w-12 rounded-full bg-primary" />
        <p className="mt-2 text-[13px] text-white/55">Visão geral do seu negócio</p>
      </div>

      {/* Search */}
      <div className="px-5 mt-5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulos, usuários, produtos..."
            className="w-full h-14 rounded-2xl bg-black/40 border border-white/10 pl-12 pr-14 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 transition"
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-xl grid place-items-center border border-primary/30 text-primary hover:bg-primary/10"
            aria-label="Filtros"
          >
            <SlidersHorizontal className="size-[16px]" />
          </button>
        </div>
      </div>

      {/* Period chips */}
      <div className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {periods.map((p) => {
            const active = period === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`shrink-0 h-9 px-4 rounded-full text-[12px] font-semibold whitespace-nowrap flex items-center gap-2 transition ${
                  active
                    ? "bg-primary/15 border border-primary text-primary"
                    : "bg-transparent border border-white/12 text-white/70"
                }`}
              >
                {p.id === "geral" ? (
                  <LayoutGrid className="size-3.5" />
                ) : (
                  <Icon className="size-3.5" />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric cards */}
      <section className="px-5 mt-5 grid grid-cols-3 gap-3">
        <Metric icon={Users} label="Professores" value="24" sub="Ativos" delta="+8%" />
        <Metric icon={User} label="Alunos" value="312" sub="Ativos" delta="+12%" />
        <Metric icon={ShoppingBag} label="Produtos" value="48" sub="Cadastrados" delta="+5%" />
      </section>

      {/* Modules header */}
      <div className="px-5 mt-7 flex items-center justify-between">
        <h2 className="text-[22px] font-extrabold tracking-tight">Módulos</h2>
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-white/15" />
          <button className="h-9 px-3.5 rounded-full border border-primary/40 text-primary text-[12px] font-semibold flex items-center gap-1.5 hover:bg-primary/10">
            <Pencil className="size-3.5" /> Personalizar
          </button>
        </div>
      </div>

      {/* Tiles grid */}
      <section className="px-5 mt-3 grid grid-cols-3 gap-3">
        {filtered.map((t) => (
          <TileCard key={t.label} {...t} />
        ))}
      </section>

      {/* Logout discreto */}
      <div className="px-5 mt-8 flex justify-center">
        <button
          onClick={logout}
          className="text-[11px] uppercase tracking-[0.32em] text-white/40 hover:text-primary flex items-center gap-1.5"
        >
          <LogOut className="size-3" /> Sair
        </button>
      </div>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2"
        style={{
          background:
            "linear-gradient(to top, #050608 55%, rgba(5,6,8,0.85) 80%, transparent)",
        }}
      >
        <div
          className="rounded-3xl border border-primary/25 bg-black/70 backdrop-blur-xl px-2 py-2.5 flex items-center justify-around"
          style={{ boxShadow: "0 -10px 40px -10px rgba(255,120,30,0.25)" }}
        >
          <NavItem icon={Home} label="Início" active />
          <NavItem icon={Users} label="Usuários" />
          <NavItem icon={ShopIcon} label="Loja" />
          <NavItem icon={Target} label="Execução" />
          <NavItem icon={MoreHorizontal} label="Mais" />
        </div>
      </nav>
    </div>
  );
}

function Sparkline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 28" className={`w-full h-7 ${className}`} fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 20 L12 18 L22 22 L34 14 L46 16 L58 10 L72 14 L84 6 L100 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 20 L12 18 L22 22 L34 14 L46 16 L58 10 L72 14 L84 6 L100 8 L100 28 L0 28 Z"
        fill="url(#spark)"
      />
    </svg>
  );
}

function Metric({
  icon: Icon, label, value, sub, delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; delta: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3 flex flex-col gap-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary">
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/80 truncate">{label}</p>
      </div>
      <p className="text-[28px] leading-none font-extrabold mt-1">{value}</p>
      <p className="text-[11px] text-primary -mt-0.5">{sub}</p>
      <div className="text-primary/90">
        <Sparkline />
      </div>
      <p className="text-[10px] text-primary/90 font-medium">
        <span className="font-bold">↑ {delta}</span>{" "}
        <span className="text-white/55">vs semana passada</span>
      </p>
    </div>
  );
}

function TileCard({ icon: Icon, label, hint, to, wide }: Tile) {
  return (
    <Link
      to={to}
      className={`group relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-3.5 flex items-center gap-3 hover:border-primary/50 hover:bg-black/55 transition ${
        wide ? "col-span-3 sm:col-span-3" : ""
      }`}
      style={{ minHeight: 86 }}
    >
      <div className="size-10 shrink-0 rounded-xl border border-primary/40 grid place-items-center text-primary">
        <Icon className="size-[18px]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold leading-tight truncate">{label}</p>
        <p className="text-[11px] text-white/55 leading-tight mt-0.5 truncate">{hint}</p>
      </div>
      <ChevronRight className="size-4 text-primary/70 group-hover:text-primary shrink-0" />
    </Link>
  );
}

function NavItem({
  icon: Icon, label, active,
}: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean }) {
  return (
    <button
      className={`flex flex-col items-center gap-0.5 flex-1 py-1 ${
        active ? "text-primary" : "text-white/55"
      }`}
    >
      <Icon className="size-[18px]" />
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
