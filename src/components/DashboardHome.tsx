import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, SlidersHorizontal, UserRound } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";

import vrumMarkAsset from "@/assets/vrum-mark.png.asset.json";

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
    <div className="vrum-dash mx-auto min-h-[100dvh] w-full max-w-[430px] space-y-3 overflow-hidden pb-28">
      <Hero name={name} subtitle={subtitle} notifCount={notifCount} heroImageUrl={heroImageUrl} />
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
  heroImageUrl: string;
}) {
  return (
    <section className="relative pb-3 pt-5">
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
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-muted-foreground">
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
      <span className="vrum-brand-chip grid size-10 place-items-center rounded-xl">
        <img
          src={vrumMarkAsset.url}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 object-contain"
          draggable={false}
        />
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
