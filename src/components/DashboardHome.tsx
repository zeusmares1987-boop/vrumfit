import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconProps = { className?: string; strokeWidth?: number };

export type DashboardModule = {
  icon: ComponentType<IconProps>;
  title: string;
  description: string;
  to: string;
  image?: string;
};

export type DashboardStat = {
  label: string;
  value: string;
  hint: string;
  trend?: string;
  icon: ComponentType<IconProps>;
};

type DashboardHomeProps = {
  name: string;
  roleLabel: string;
  modeLabel: string;
  subtitle: string;
  avatarUrl: string;
  heroImageUrl: string;
  referenceImageUrl?: string;
  searchPlaceholder: string;
  modules: DashboardModule[];
  stats: DashboardStat[];
  notifCount?: number;
  alerts?: ReactNode;
  beforeStats?: ReactNode;
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHome({
  name,
  subtitle,
  searchPlaceholder,
  modules,
  stats,
  notifCount = 0,
  alerts,
  beforeStats,
}: DashboardHomeProps) {
  const [query, setQuery] = useState("");

  const visibleModules = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return modules;
    return modules.filter((m) => `${m.title} ${m.description}`.toLowerCase().includes(clean));
  }, [modules, query]);

  return (
    <div className="vrum-dash mx-auto min-h-[100dvh] w-full max-w-[430px] space-y-3 overflow-hidden pb-28">
      <Hero name={name} subtitle={subtitle} notifCount={notifCount} />
      {alerts}
      {beforeStats}
      {stats.length > 0 && <StatsRow stats={stats} />}
      <SearchRow value={query} onChange={setQuery} placeholder={searchPlaceholder} />
      <ModuleGrid modules={visibleModules} />
    </div>
  );
}

function Hero({
  name,
  subtitle,
  notifCount,
}: {
  name: string;
  subtitle: string;
  notifCount: number;
}) {
  return (
    <section className="vrum-hero relative overflow-hidden pb-2 pt-5">
      <HeroScene />

      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <Brand />
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/config" aria-label="Perfil" className="vrum-top-icon relative grid size-10 place-items-center rounded-full">
            <UserRound className="size-5 text-foreground" strokeWidth={1.9} />
            {notifCount > 0 && <span className="vrum-notif-badge">{Math.min(notifCount, 9)}</span>}
          </Link>
        </div>
      </header>

      <div className="relative mt-12 max-w-[70%]">
        <h1 className="vrum-greeting text-[27px] font-black leading-[1.08] text-foreground">
          {greeting()}, <span className="text-primary">{name}!</span>
        </h1>
        <p className="mt-1.5 max-w-[250px] text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}

function HeroScene() {
  return (
    <div className="vrum-coded-hero" aria-hidden="true">
      <span className="vrum-coded-panel vrum-coded-panel-a" />
      <span className="vrum-coded-panel vrum-coded-panel-b" />
      <span className="vrum-coded-person" />
      <span className="vrum-coded-tablet" />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <VrumMark className="size-8 shrink-0" />
      <div className="min-w-0 leading-none">
        <div className="truncate text-[22px] font-black italic text-foreground">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="mt-1 text-[9px] font-bold tracking-[0.42em] text-foreground/85">PERSONAL</div>
      </div>
    </div>
  );
}

function VrumMark({ className }: { className?: string }) {
  return (
    <svg className={cn("dashboard-v-mark", className)} viewBox="0 0 64 64" role="img" aria-label="VrumFit">
      <defs>
        <linearGradient id="vrumMarkGradient" x1="9" x2="55" y1="8" y2="58" gradientUnits="userSpaceOnUse">
          <stop className="dashboard-v-stop-a" />
          <stop offset="1" className="dashboard-v-stop-b" />
        </linearGradient>
      </defs>
      <path d="M5 9h14l13 30L49 9h10L38 55H26L5 9Z" fill="url(#vrumMarkGradient)" />
      <path d="M20 9h14L24 31 16 16l4-7Z" className="dashboard-v-mark-shadow" />
      <path d="M36 37 50 12h8L40 55h-9l5-18Z" className="dashboard-v-mark-highlight" />
    </svg>
  );
}

function StatsRow({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="grid grid-cols-3 gap-1.5">
      {stats.map((s) => <StatCard key={s.label} stat={s} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="vrum-stat-card relative min-h-[76px] overflow-hidden rounded-[14px] p-2">
      <div className="vrum-mini-ring absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-primary">
        <stat.icon className="size-4" strokeWidth={1.75} />
      </div>
      <div className="ml-10 min-w-0 pr-2.5">
          <p className="truncate text-[9px] font-semibold text-foreground">{stat.label}</p>
          <p className="mt-0.5 text-[22px] font-black leading-none text-foreground">{stat.value}</p>
          <p className="mt-0.5 truncate text-[9px] text-muted-foreground">{stat.hint}</p>
      </div>
      <ChevronRight className="absolute right-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={2.4} />
    </article>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
      <label className="vrum-search-box relative flex h-12 items-center rounded-[14px] px-3.5">
        <Search className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ml-2.5 h-full min-w-0 w-full bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
      <button type="button" className="vrum-search-box inline-flex h-12 items-center gap-2 rounded-[14px] px-3.5 text-[12px] font-semibold text-primary">
        <SlidersHorizontal className="size-4" strokeWidth={1.9} />
        Filtros
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 pt-1">
      {modules.map((m) => <ModuleCard key={m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link to={module.to} className="vrum-module-card group relative block min-h-[116px] overflow-hidden rounded-[16px] p-4 text-left transition active:scale-[0.98]">
      <div className="vrum-module-ring grid size-12 place-items-center rounded-full text-primary">
        <module.icon className="size-7" strokeWidth={1.75} />
      </div>
      <ChevronRight className="absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" strokeWidth={2.3} />
      <p className="mt-3 truncate pr-5 text-[18px] font-bold leading-tight text-foreground">{module.title}</p>
      <p className="mt-1 line-clamp-2 pr-4 text-[12px] leading-tight text-muted-foreground">{module.description}</p>
    </Link>
  );
}
