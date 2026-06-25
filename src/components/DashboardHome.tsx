import { Link } from "@tanstack/react-router";
import dashboardBackdrop from "@/assets/dashboard-backdrop.jpg";
import { ChevronRight, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode, type SyntheticEvent } from "react";


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
  heroImageUrl,
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
    <div className="vrum-dash relative mx-auto min-h-[100dvh] w-full max-w-[430px] overflow-hidden pb-28">
      <DashboardBackdrop src={heroImageUrl} />
      <div className="relative z-10 space-y-3">
        <Hero name={name} subtitle={subtitle} notifCount={notifCount} />
        {alerts}
        {beforeStats}
        {stats.length > 0 && <StatsRow stats={stats} />}
        <SearchRow value={query} onChange={setQuery} placeholder={searchPlaceholder} />
        <ModuleGrid modules={visibleModules} />
      </div>
    </div>
  );
}

function DashboardBackdrop({ src }: { src: string }) {
  const fallbackSrc = dashboardBackdrop;
  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.dataset.fallbackApplied) return;
    event.currentTarget.dataset.fallbackApplied = "true";
    event.currentTarget.src = fallbackSrc;
  };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-[-22px] top-0 z-0 h-[390px] overflow-hidden">
      <img src={src || fallbackSrc} alt="" width={1280} height={768} onError={handleImageError} className="absolute inset-0 h-full w-full scale-110 object-cover opacity-85 blur-[18px] saturate-125" />
      <img src={fallbackSrc} alt="" width={1280} height={768} className="absolute inset-0 h-full w-full object-cover opacity-28 saturate-125" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/55 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/78 via-background/20 to-background/62" />
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
    <section className="relative px-1 pb-6 pt-5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-10 size-52 rounded-full bg-primary/20 blur-3xl" />
      <header className="flex items-center justify-between">
        <Brand />
        <Link
          to="/config"
          aria-label="Perfil"
          className="vrum-top-icon relative grid size-10 place-items-center rounded-full"
        >
          <UserRound className="size-5 text-foreground" strokeWidth={1.9} />
          {notifCount > 0 && <span className="vrum-notif-badge">{Math.min(notifCount, 9)}</span>}
        </Link>
      </header>

      <div className="mt-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary">
          {greeting()}
        </p>
        <h1 className="mt-1 text-[30px] font-black leading-[1.02] tracking-tight text-foreground">
          {name}<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 max-w-[280px] text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}



function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="vrum-brand-chip grid size-10 place-items-center rounded-xl" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5l8 14L20 5" className="text-primary" stroke="currentColor" />
        </svg>
      </span>
      <div className="leading-none">
        <div className="text-[19px] font-black italic tracking-tight text-foreground">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="mt-1 text-[9px] font-bold tracking-[0.34em] text-muted-foreground">
          PERSONAL
        </div>
      </div>
    </div>
  );
}

function StatsRow({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="grid grid-cols-3 gap-2">
      {stats.map((s) => <StatCard key={s.label} stat={s} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="vrum-stat-card relative flex min-h-[96px] flex-col justify-between overflow-hidden rounded-[18px] p-3">
      <div className="flex items-start justify-between">
        <div className="vrum-mini-ring grid size-8 place-items-center rounded-xl text-primary">
          <stat.icon className="size-4" strokeWidth={1.9} />
        </div>
        {stat.trend && (
          <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary">
            {stat.trend}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-black leading-none tracking-tight text-foreground">{stat.value}</p>
        <p className="mt-1 truncate text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
      </div>
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
    <section className="grid grid-cols-3 gap-2.5 pt-1 sm:gap-3">
      {modules.map((m) => <ModuleCard key={m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      to={module.to}
      className="vrum-module-card group relative flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-[18px] p-3 text-center transition active:scale-[0.97]"
    >
      <div className="vrum-module-ring grid size-11 place-items-center rounded-2xl text-primary">
        <module.icon className="size-[22px]" strokeWidth={1.9} />
      </div>
      <p className="line-clamp-2 w-full px-0.5 text-[11.5px] font-semibold leading-[1.15] text-foreground">
        {module.title}
      </p>
    </Link>
  );
}
