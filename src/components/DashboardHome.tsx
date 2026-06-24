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
  avatarUrl,
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
    <div className="dashboard-home space-y-4 pb-6 md:space-y-5">
      <Hero name={name} subtitle={subtitle} avatarUrl={avatarUrl} heroImageUrl={heroImageUrl} />
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
  avatarUrl: _avatarUrl,
  heroImageUrl,
}: {
  name: string;
  subtitle: string;
  avatarUrl: string;
  heroImageUrl: string;
}) {
  return (
    <section className="dashboard-hero relative -mx-4 min-h-[206px] overflow-hidden px-4 pb-4 pt-7 md:min-h-[345px] md:pb-7 md:pt-10">
      <div className="dashboard-hero-grid" aria-hidden="true" />
      <div className="dashboard-hero-figure" aria-hidden="true">
        <img src={heroImageUrl} alt="" className="dashboard-hero-image" loading="eager" />
      </div>

      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Brand />
        <Link
          to="/config"
          aria-label="Meu perfil"
          className="dashboard-profile grid size-[52px] shrink-0 place-items-center rounded-full text-primary transition hover:bg-primary/10"
        >
          <UserIcon className="size-6" />
        </Link>
      </header>

      <div className="relative mt-14 max-w-[72%] md:mt-24">
        <h1 className="dashboard-heading text-[34px] font-black leading-[1.04] tracking-[-0.045em] text-foreground md:text-[58px]">
          {greeting()},{" "}
          <span className="text-primary">{name}!</span>
        </h1>
        <p className="mt-3 text-[15px] leading-snug text-muted-foreground md:text-[23px]">{subtitle}</p>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-3 md:gap-5">
      <VrumMark className="size-[58px] shrink-0 md:size-[93px]" />
      <div className="min-w-0 leading-none">
        <div className="dashboard-logo-text truncate text-[31px] font-black italic tracking-[-0.08em] text-foreground md:text-[52px]">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="mt-2 pl-5 text-[11px] font-bold tracking-[0.62em] text-foreground/90 md:mt-3 md:pl-9 md:text-[18px]">PERSONAL</div>
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
      <path d="M4 10h18l13 21L53 10h7L36 54h-9L4 10Z" fill="url(#vrumMarkGradient)" />
      <path d="M23 10h16L25 36 17 21l6-11Z" className="dashboard-v-mark-shadow" />
      <path d="M35 39 50 16h9L40 54h-9l4-15Z" className="dashboard-v-mark-highlight" />
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
    <article className="dashboard-panel relative min-h-[86px] min-w-0 overflow-hidden rounded-[22px] p-3 md:min-h-[160px] md:rounded-[24px] md:p-7">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-1 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-5">
        <div className="dashboard-icon-ring grid size-8 shrink-0 place-items-center rounded-full text-primary md:size-[64px]">
          <stat.icon className="size-4 md:size-8" />
        </div>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-[20px] font-semibold leading-tight text-foreground">{stat.label}</p>
          <p className="truncate text-[46px] font-black leading-none tracking-[-0.045em] text-foreground">{stat.value}</p>
          <p className="mt-2 truncate text-[18px] leading-none text-muted-foreground">{stat.hint}</p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/70 md:mt-0 md:size-8" />
      </div>
      <div className="mt-2 min-w-0 md:hidden">
        <p className="truncate text-[10px] font-semibold leading-tight text-foreground">{stat.label}</p>
        <p className="truncate text-[23px] font-black leading-none tracking-[-0.045em] text-foreground">{stat.value}</p>
        <p className="mt-1 truncate text-[10px] leading-none text-muted-foreground">{stat.hint}</p>
      </div>
    </article>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2.5 md:grid-cols-[minmax(0,1fr)_190px] md:gap-6">
      <label className="relative">
        <Search className="absolute left-4 top-1/2 size-[29px] -translate-y-1/2 text-muted-foreground md:left-8 md:size-12" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="dashboard-search-box h-[58px] w-full rounded-[19px] pl-[60px] pr-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/70 md:h-[92px] md:rounded-[25px] md:pl-[94px] md:text-[24px]"
        />
      </label>
      <button type="button" className="dashboard-search-box grid h-[58px] shrink-0 grid-flow-col place-content-center items-center gap-2 rounded-[19px] px-3 text-[15px] font-bold text-primary transition hover:border-primary/60 md:h-[92px] md:gap-5 md:rounded-[25px] md:text-[24px]">
        <SlidersHorizontal className="size-5 md:size-9" />
        Filtros
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:gap-6">
      {modules.map((m) => <ModuleCard key={m.title + m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      to={module.to}
      className="dashboard-module group relative min-h-[136px] overflow-hidden rounded-[24px] p-4 transition active:scale-[0.98] hover:border-primary/55 md:min-h-[210px] md:p-7"
    >
      <div className="flex items-start justify-between">
        <div className="dashboard-icon-ring grid size-[58px] place-items-center rounded-full text-primary md:size-[82px]">
          <module.icon className="size-[29px] md:size-10" />
        </div>
        <ChevronRight className="size-5 text-muted-foreground/70 transition group-hover:translate-x-0.5 group-hover:text-primary md:size-7" />
      </div>
      <div className="mt-7 md:mt-12">
        <p className="truncate text-[19px] font-black leading-tight tracking-[-0.035em] text-foreground md:text-[28px]">{module.title}</p>
        <p className="mt-1 line-clamp-1 text-[13px] text-muted-foreground md:mt-2 md:text-[18px]">{module.description}</p>
      </div>
    </Link>
  );
}
