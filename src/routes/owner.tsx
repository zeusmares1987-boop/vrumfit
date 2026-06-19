import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, SlidersHorizontal, ChevronDown, ChevronRight,
  Users, Dumbbell, User, ShoppingBag, Package, CreditCard,
  Wallet, Target, Bell, FolderOpen, LayoutGrid,
  Home, ShoppingBag as ShopIcon, MoreHorizontal, LogOut,
  Calendar,
} from "lucide-react";
import logoV from "@/assets/logo-v.png";
import avatarOwner from "@/assets/avatar-owner.jpg";
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
  bg: string;
};

const smallTiles: Tile[] = [
  { icon: Users, label: "Usuários", hint: "Gerencie acessos e permissões", to: "/personais", bg: tileUsuarios },
  { icon: Dumbbell, label: "Professores", hint: "Equipe e gestão de professores", to: "/personais", bg: tileProfessores },
  { icon: User, label: "Alunos", hint: "Alunos e matrículas", to: "/alunos", bg: tileAlunos },
  { icon: ShoppingBag, label: "Loja", hint: "Sua loja online integrada", to: "/loja", bg: tileLoja },
  { icon: Package, label: "Produtos", hint: "Catálogo e estoque", to: "/produtos", bg: tileProdutos },
  { icon: CreditCard, label: "Planos", hint: "Planos e assinaturas", to: "/planos", bg: tilePlanos },
  { icon: Wallet, label: "Financeiro", hint: "Receitas, despesas e relatórios", to: "/financeiro", bg: tileFinanceiro },
  { icon: Target, label: "Execução", hint: "Metas, treinos e indicadores", to: "/treinos", bg: tileExecucao },
  { icon: Bell, label: "Avisos", hint: "Comunicados e notificações", to: "/avisos", bg: tileAvisos },
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

  const q = query.toLowerCase();
  const filteredSmall = smallTiles.filter((t) =>
    (t.label + " " + t.hint).toLowerCase().includes(q),
  );
  const filteredWide = wideTiles.filter((t) =>
    (t.label + " " + t.hint).toLowerCase().includes(q),
  );

  return (
    <div
      className="min-h-[100dvh] pb-[calc(110px+env(safe-area-inset-bottom))] font-display text-white"
      style={{ background: "#040506" }}
    >
      {/* Top bar */}
      <header className="relative px-5 pt-[max(env(safe-area-inset-top),2.25rem)] pb-3 flex items-center justify-between gap-3">
        <Link to="/owner" className="flex items-center gap-2 shrink-0">
          <img
            src={logoV}
            alt=""
            width={44}
            height={44}
            className="size-11 drop-shadow-[0_4px_12px_rgba(255,140,40,0.4)]"
          />
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

        <button className="flex items-center gap-2 min-w-0" aria-label="Trocar de modo">
          <div className="relative shrink-0">
            <img
              src={avatarOwner}
              alt=""
              width={44}
              height={44}
              className="size-11 rounded-full object-cover border-2 border-primary"
            />
            <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 blur-[2px]" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-[13px] font-semibold leading-tight truncate">Proprietário</p>
            <p className="text-[11px] text-primary flex items-center gap-0.5 leading-tight underline underline-offset-2 decoration-primary/40">
              Modo gestor <ChevronDown className="size-3" />
            </p>
          </div>
        </button>

        <button className="relative size-10 rounded-full grid place-items-center shrink-0" aria-label="Notificações">
          <Bell className="size-[22px] text-primary" />
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-[10px] font-bold text-white grid place-items-center">
            3
          </span>
        </button>
      </header>

      {/* Welcome */}
      <section className="px-5 mt-2 relative">
        <div className="relative rounded-[18px] overflow-hidden">
          <img
            src={headerGym}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
          <div className="relative p-4 pr-20 min-h-[88px]">
            <h1 className="text-[24px] font-extrabold leading-tight tracking-tight">
              Bem-vindo, <span className="text-primary">Proprietário</span>
            </h1>
            <p className="mt-1 text-[13px] text-white/70">Tenha controle total do seu negócio</p>
            <img
              src={logoV}
              alt=""
              width={56}
              height={56}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-12 opacity-90"
            />
          </div>
        </div>
      </section>

      {/* Search */}
      <div className="px-5 mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/55" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar módulos, usuários, produtos..."
            className="w-full h-14 rounded-2xl bg-black/60 border border-white/10 pl-12 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 transition"
          />
        </div>
        <button
          className="h-14 px-4 rounded-2xl border border-primary/40 text-primary font-semibold text-[13px] flex items-center gap-2 hover:bg-primary/10 shrink-0"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="size-[16px]" />
          Filtros
        </button>
      </div>

      {/* Period chips */}
      <div className="mt-4 px-5">
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {periods.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`shrink-0 h-10 px-4 rounded-full text-[12px] font-semibold whitespace-nowrap flex items-center gap-2 transition ${
                  active
                    ? "bg-primary/15 border border-primary text-primary"
                    : "bg-transparent border border-white/12 text-white/75"
                }`}
              >
                {p.id === "geral" ? (
                  <LayoutGrid className="size-3.5" />
                ) : (
                  <Calendar className="size-3.5" />
                )}
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric cards */}
      <section className="px-5 mt-4 grid grid-cols-3 gap-3">
        <Metric icon={Users} label="Professores" value="24" sub="Ativos" delta="8%" />
        <Metric icon={User} label="Alunos" value="312" sub="Ativos" delta="12%" />
        <Metric icon={ShoppingBag} label="Produtos" value="48" sub="Cadastrados" delta="5%" />
      </section>

      {/* Modules header */}
      <div className="px-5 mt-6 flex items-center justify-between">
        <h2 className="text-[22px] font-extrabold tracking-tight flex items-center gap-2">
          <span className="inline-block w-[3px] h-5 bg-primary rounded-full" />
          Módulos
        </h2>
        <button className="h-9 px-3.5 rounded-full border border-primary/40 text-primary text-[12px] font-semibold flex items-center gap-1.5 hover:bg-primary/10">
          <SlidersHorizontal className="size-3.5" /> Ordenar
          <ChevronDown className="size-3.5" />
        </button>
      </div>

      {/* Small tiles 3-col */}
      <section className="px-5 mt-3 grid grid-cols-3 gap-2.5">
        {filteredSmall.map((t) => (
          <PhotoTile key={t.label} {...t} />
        ))}
      </section>

      {/* Wide tiles 2-col */}
      {filteredWide.length > 0 && (
        <section className="px-5 mt-2.5 grid grid-cols-2 gap-2.5">
          {filteredWide.map((t) => (
            <PhotoTile key={t.label} {...t} wide />
          ))}
        </section>
      )}

      {/* Logout */}
      <div className="px-5 mt-7 flex justify-center">
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
            "linear-gradient(to top, #040506 55%, rgba(4,5,6,0.85) 80%, transparent)",
        }}
      >
        <div
          className="rounded-3xl border border-primary/30 bg-black/75 backdrop-blur-xl px-2 py-2.5 flex items-center justify-around"
          style={{ boxShadow: "0 -10px 40px -10px rgba(255,120,30,0.3)" }}
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

function Sparkline() {
  return (
    <svg viewBox="0 0 100 28" className="w-full h-7 text-primary" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 22 L10 14 L20 18 L30 10 L40 16 L50 8 L60 14 L70 6 L80 12 L90 4 L100 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 22 L10 14 L20 18 L30 10 L40 16 L50 8 L60 14 L70 6 L80 12 L90 4 L100 10 L100 28 L0 28 Z"
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
    <div className="rounded-2xl border border-white/10 bg-black/50 p-3 flex flex-col gap-1.5 backdrop-blur-md">
      <div className="flex items-center gap-1.5">
        <div className="size-7 rounded-lg border border-primary/40 grid place-items-center text-primary shrink-0">
          <Icon className="size-3.5" />
        </div>
        <p className="text-[11px] font-semibold text-white/85 truncate">{label}</p>
      </div>
      <p className="text-[26px] leading-none font-extrabold mt-1">{value}</p>
      <p className="text-[11px] text-primary -mt-0.5">{sub}</p>
      <Sparkline />
      <p className="text-[10px] text-primary font-medium leading-tight">
        <span className="font-bold">↑ {delta}</span>{" "}
        <span className="text-white/55">vs semana passada</span>
      </p>
    </div>
  );
}

function PhotoTile({
  icon: Icon, label, hint, to, bg, wide,
}: Tile & { wide?: boolean }) {
  return (
    <Link
      to={to}
      className={`group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition block ${
        wide ? "aspect-[16/9]" : "aspect-[5/6]"
      }`}
    >
      <img
        src={bg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.15) 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      <div className="relative h-full p-3 flex flex-col">
        <div className="size-9 rounded-xl border border-primary/50 bg-black/55 backdrop-blur-sm grid place-items-center text-primary">
          <Icon className="size-[16px]" />
        </div>
        <div className="mt-auto pr-5">
          <p className="text-[14px] font-extrabold leading-tight">{label}</p>
          <p className="text-[10.5px] text-white/65 leading-snug mt-0.5 line-clamp-2">{hint}</p>
        </div>
        <ChevronRight className="absolute bottom-2.5 right-2.5 size-4 text-primary" />
      </div>
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
