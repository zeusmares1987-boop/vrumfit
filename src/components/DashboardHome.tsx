import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, SlidersHorizontal, User as UserIcon } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardModule = {
  icon: ComponentType<{ className?: string }>;
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
  icon: ComponentType<{ className?: string }>;
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
    <div className="vrum-dash space-y-5 pb-28">
      <Hero name={name} subtitle={subtitle} heroImageUrl={heroImageUrl} />
      {alerts}
      {beforeStats}
      {stats.length > 0 && <StatsRow stats={stats} />}
      <SearchRow value={query} onChange={setQuery} placeholder={searchPlaceholder} />
      <ModuleGrid modules={visibleModules} />
    </div>
  );
}

function Hero({ name, subtitle, heroImageUrl }: { name: string; subtitle: string; heroImageUrl: string }) {
  return (
    <section className="vrum-hero relative -mx-4 overflow-hidden px-4 pb-2 pt-5 md:-mx-10 md:px-10 md:pt-7">
      <img src={heroImageUrl} alt="" aria-hidden="true" className="vrum-hero-photo" />
      <div className="vrum-hero-fade" aria-hidden="true" />

      <header className="relative flex items-start justify-between gap-4">
        <Brand />
        <Link to="/config" aria-label="Meu perfil" className="vrum-profile-btn grid size-12 place-items-center rounded-full md:size-14">
          <UserIcon className="size-6 text-primary md:size-7" strokeWidth={1.8} />
        </Link>
      </header>

      <div className="relative mt-8 max-w-[62%] md:mt-12 md:max-w-[58%]">
        <h1 className="vrum-greeting text-[40px] font-black leading-[1.02] tracking-[-0.04em] text-foreground md:text-[60px]">
          {greeting()}, <span className="text-primary">{name}!</span>
        </h1>
        <p className="mt-2 text-[14px] leading-snug text-muted-foreground md:text-[18px]">{subtitle}</p>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2 md:gap-3">
      <VrumMark className="size-10 shrink-0 md:size-14" />
      <div className="min-w-0 leading-none">
        <div className="truncate text-[24px] font-black italic tracking-[-0.06em] text-foreground md:text-[34px]">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="mt-1 text-[9px] font-bold tracking-[0.5em] text-foreground/85 md:text-[11px]">PERSONAL</div>
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
    <section className="grid grid-cols-3 gap-2.5 md:gap-4">
      {stats.map((s) => <StatCard key={s.label} stat={s} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="vrum-card relative overflow-hidden rounded-2xl p-3 md:p-4">
      <div className="flex items-start gap-2.5 md:gap-3">
        <div className="vrum-icon-ring grid size-10 shrink-0 place-items-center rounded-full text-primary md:size-12">
          <stat.icon className="size-5 md:size-6" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground md:text-[13px]">{stat.label}</p>
          <p className="mt-0.5 text-[24px] font-black leading-none tracking-[-0.04em] text-foreground md:text-[32px]">{stat.value}</p>
          <p className="mt-1 truncate text-[10px] text-muted-foreground md:text-[12px]">{stat.hint}</p>
        </div>
        <ChevronRight className="size-4 shrink-0 self-center text-muted-foreground/70" />
      </div>
    </article>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 md:gap-3">
      <label className="vrum-card relative flex items-center rounded-2xl px-4 md:px-5">
        <Search className="size-5 text-muted-foreground md:size-6" strokeWidth={1.8} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="ml-3 h-12 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground md:h-14 md:text-[16px]"
        />
      </label>
      <button type="button" className="vrum-card inline-flex items-center gap-2 rounded-2xl px-4 text-[14px] font-semibold text-primary md:gap-3 md:px-6 md:text-[16px]">
        <SlidersHorizontal className="size-5 md:size-6" strokeWidth={1.8} />
        Filtros
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-2 gap-2.5 md:gap-4">
      {modules.map((m) => <ModuleCard key={m.title + m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link to={module.to} className="vrum-card relative block overflow-hidden rounded-2xl p-4 transition active:scale-[0.98] md:p-5">
      <div className="flex items-start justify-between">
        <div className="vrum-icon-ring grid size-14 place-items-center rounded-full text-primary md:size-16">
          <module.icon className="size-7 md:size-8" strokeWidth={1.7} />
        </div>
        <ChevronRight className="size-5 text-muted-foreground/70 md:size-6" />
      </div>
      <p className="mt-6 text-[18px] font-bold leading-tight tracking-[-0.02em] text-foreground md:text-[22px]">{module.title}</p>
      <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground md:text-[14px]">{module.description}</p>
    </Link>
  );
}
