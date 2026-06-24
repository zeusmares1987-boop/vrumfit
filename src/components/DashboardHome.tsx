import { Link } from "@tanstack/react-router";
import { Bell, MoreVertical, Search, SlidersHorizontal } from "lucide-react";
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
  roleLabel,
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
    <div className="vrum-dash mx-auto min-h-[100dvh] w-full max-w-[430px] space-y-4 overflow-hidden pb-28">
      <Hero name={name} roleLabel={roleLabel} subtitle={subtitle} heroImageUrl={heroImageUrl} notifCount={notifCount} />
      {alerts}
      {beforeStats}
      <SearchRow value={query} onChange={setQuery} placeholder={searchPlaceholder} />
      {stats.length > 0 && <StatsRow stats={stats} />}
      <ModuleGrid modules={visibleModules} />
    </div>
  );
}

function Hero({
  name,
  roleLabel,
  subtitle,
  heroImageUrl,
  notifCount,
}: {
  name: string;
  roleLabel: string;
  subtitle: string;
  heroImageUrl: string;
  notifCount: number;
}) {
  return (
    <section className="vrum-hero relative -mx-4 overflow-hidden px-4 pb-1 pt-7">
      <img src={heroImageUrl} alt="" aria-hidden="true" className="vrum-hero-photo" />
      <div className="vrum-hero-fade" aria-hidden="true" />

      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <Brand />
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/avisos" aria-label="Avisos" className="vrum-top-icon relative grid size-11 place-items-center rounded-full">
            <Bell className="size-5 text-foreground" strokeWidth={1.9} />
            {notifCount > 0 && <span className="vrum-notif-badge">{Math.min(notifCount, 9)}</span>}
          </Link>
          <Link to="/config" aria-label="Mais opções" className="grid size-10 place-items-center rounded-full text-foreground/80">
            <MoreVertical className="size-6" strokeWidth={2.2} />
          </Link>
        </div>
      </header>

      <div className="relative mt-12 max-w-[66%]">
        <h1 className="vrum-greeting text-[39px] font-black leading-[1.03] text-foreground">
          {greeting()},<br /> <span className="text-primary">{roleLabel || name}</span>
        </h1>
        <p className="mt-3 max-w-[245px] text-[15px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>

      <div className="vrum-pulse-line relative mt-8" aria-hidden="true" />
    </section>
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
    <section className="grid grid-cols-3 gap-2.5">
      {stats.map((s) => <StatCard key={s.label} stat={s} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="vrum-stat-card relative overflow-hidden rounded-[14px] p-2.5">
      <div className="flex items-center gap-2">
        <div className="vrum-mini-ring grid size-7 shrink-0 place-items-center rounded-full text-primary">
          <stat.icon className="size-3.5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-semibold text-muted-foreground">{stat.label}</p>
          <p className="text-[19px] font-black leading-none text-foreground">{stat.value}</p>
        </div>
      </div>
      <p className="mt-1 truncate text-[9px] text-muted-foreground">{stat.hint}</p>
    </article>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5">
      <label className="vrum-search-box relative flex h-16 items-center rounded-[22px] px-4">
        <Search className="size-7 shrink-0 text-muted-foreground" strokeWidth={1.8} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ml-3 h-full min-w-0 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />
      </label>
      <button type="button" className="vrum-search-box inline-flex h-16 items-center gap-2 rounded-[22px] px-4 text-[14px] font-semibold text-primary">
        <SlidersHorizontal className="size-5" strokeWidth={1.8} />
        Filtros
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-3 gap-x-3 gap-y-6 pt-1">
      {modules.map((m) => <ModuleCard key={m.title + m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link to={module.to} className="group block min-w-0 text-center transition active:scale-[0.96]">
      <div className="vrum-launcher-ring mx-auto grid size-[86px] place-items-center rounded-full text-primary">
        <module.icon className="size-11" strokeWidth={1.65} />
      </div>
      <p className="mt-2 truncate text-[16px] font-bold leading-tight text-foreground">{module.title}</p>
      <p className="mx-auto mt-0.5 line-clamp-2 max-w-[108px] text-[11px] leading-tight text-muted-foreground">{module.description}</p>
    </Link>
  );
}
