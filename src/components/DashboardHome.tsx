import { Link } from "@tanstack/react-router";
import { Bell, ChevronDown, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";
import logoVAsset from "@/assets/logo-v.webp.asset.json";
import { cn } from "@/lib/utils";

const logoV = logoVAsset.url;

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
  trend: string;
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
  filters: string[];
  notifCount?: number;
  alerts?: ReactNode;
};

export function DashboardHome({
  name,
  roleLabel,
  modeLabel,
  subtitle,
  avatarUrl,
  heroImageUrl,
  searchPlaceholder,
  modules,
  stats,
  filters,
  notifCount = 0,
  alerts,
}: DashboardHomeProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? "Visão geral");

  const visibleModules = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return modules;
    return modules.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(clean));
  }, [modules, query]);

  return (
    <div className="relative left-1/2 w-screen max-w-5xl -translate-x-1/2 px-4 pb-6">
      <DashboardHero
        name={name}
        roleLabel={roleLabel}
        modeLabel={modeLabel}
        subtitle={subtitle}
        avatarUrl={avatarUrl}
        heroImageUrl={heroImageUrl}
        notifCount={notifCount}
        searchPlaceholder={searchPlaceholder}
        query={query}
        onQueryChange={setQuery}
      />

      <FilterPills filters={filters} activeFilter={activeFilter} onChange={setActiveFilter} />
      {alerts && <div className="mt-4">{alerts}</div>}
      <StatsGrid stats={stats} />
      <ModuleSection modules={visibleModules} />
    </div>
  );
}

function DashboardHero({
  name,
  roleLabel,
  modeLabel,
  subtitle,
  avatarUrl,
  heroImageUrl,
  notifCount,
  searchPlaceholder,
  query,
  onQueryChange,
}: {
  name: string;
  roleLabel: string;
  modeLabel: string;
  subtitle: string;
  avatarUrl: string;
  heroImageUrl: string;
  notifCount: number;
  searchPlaceholder: string;
  query: string;
  onQueryChange: (value: string) => void;
}) {
  return (
    <section className="relative -mx-4 overflow-hidden border-b border-primary/25 bg-background px-4 pb-5 pt-4 shadow-[0_18px_60px_-28px_var(--color-primary)]">
      <div className="absolute inset-0">
        <img src={heroImageUrl} alt="" className="size-full object-cover opacity-40" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>

      <div className="relative flex items-center justify-between gap-3">
        <Brand />
        <div className="flex items-center gap-2 sm:gap-3">
          <ProfileChip avatarUrl={avatarUrl} roleLabel={roleLabel} modeLabel={modeLabel} />
          <button aria-label="Notificações" className="relative grid size-10 place-items-center rounded-full border border-border bg-card/70 text-muted-foreground backdrop-blur transition hover:text-primary sm:size-11">
            <Bell className="size-5" />
            {notifCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">{notifCount}</span>}
          </button>
        </div>
      </div>

      <div className="relative mt-8 max-w-xl">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-foreground md:text-4xl">
          Bem-vindo, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
      </div>

      <div className="relative mt-7 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-14 w-full rounded-full border border-border bg-card/80 pl-14 pr-5 text-sm text-foreground outline-none backdrop-blur placeholder:text-muted-foreground focus:border-primary/70"
          />
        </label>
        <button className="flex h-14 items-center justify-center gap-3 rounded-full border border-border bg-card/80 px-7 font-bold text-primary backdrop-blur transition hover:border-primary/60">
          <SlidersHorizontal className="size-5" /> Filtros
        </button>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src={logoV} alt="VrumFit" className="size-10 object-contain drop-shadow-[0_0_14px_var(--color-primary)] sm:size-14" />
      <div className="leading-none">
        <div className="text-xl font-black italic tracking-tight text-foreground sm:text-2xl">Vrum<span className="text-primary">Fit</span></div>
        <div className="mt-1 text-[8px] font-bold tracking-[0.35em] text-muted-foreground sm:text-[10px] sm:tracking-[0.45em]">PERSONAL</div>
      </div>
    </div>
  );
}

function ProfileChip({ avatarUrl, roleLabel, modeLabel }: { avatarUrl: string; roleLabel: string; modeLabel: string }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <img src={avatarUrl} alt="" className="size-10 rounded-full border border-primary object-cover shadow-[0_0_24px_-6px_var(--color-primary)] sm:size-14" />
      <div className="leading-tight">
        <p className="text-sm font-semibold text-foreground sm:text-lg">{roleLabel}</p>
        <button className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary underline underline-offset-4 sm:gap-2 sm:text-sm">
          {modeLabel} <ChevronDown className="size-4" />
        </button>
      </div>
    </div>
  );
}

function FilterPills({ filters, activeFilter, onChange }: { filters: string[]; activeFilter: string; onChange: (value: string) => void }) {
  return (
    <div className="no-scrollbar -mx-1 mt-4 flex gap-3 overflow-x-auto px-1 pb-1">
      {filters.map((filter) => {
        const active = filter === activeFilter;
        return (
          <button key={filter} onClick={() => onChange(filter)} className={cn("h-12 shrink-0 rounded-full border px-5 text-sm font-semibold transition", active ? "border-primary bg-primary/15 text-primary shadow-[0_0_22px_-10px_var(--color-primary)]" : "border-border bg-card text-muted-foreground hover:text-foreground")}>
            {filter}
          </button>
        );
      })}
    </div>
  );
}

function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="rounded-3xl border border-border bg-card/80 p-5 shadow-[0_18px_55px_-35px_var(--color-primary)]">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-12 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <stat.icon className="size-6" />
        </div>
        <span className="text-xs font-bold text-primary">{stat.trend}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{stat.label}</p>
      <p className="mt-1 text-4xl font-black tracking-tight text-foreground">{stat.value}</p>
      <p className="mt-1 text-sm text-primary">{stat.hint}</p>
      <Sparkline />
    </article>
  );
}

function Sparkline() {
  return (
    <svg viewBox="0 0 180 48" className="mt-5 h-12 w-full text-primary" fill="none" aria-hidden>
      <path d="M0 37 L16 25 L30 31 L46 20 L62 26 L78 16 L96 24 L112 18 L128 8 L146 17 L162 13 L180 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0 37 L16 25 L30 31 L46 20 L62 26 L78 16 L96 24 L112 18 L128 8 L146 17 L162 13 L180 20 L180 48 L0 48 Z" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function ModuleSection({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-primary pl-3 text-2xl font-bold text-foreground">Módulos</h2>
        <button className="hidden rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-primary sm:inline-flex">Ordenar</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => <ModuleCard key={module.title} module={module} />)}
      </div>
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link to={module.to} className="group relative min-h-[150px] overflow-hidden rounded-3xl border border-border bg-card p-5 transition active:scale-[0.99] hover:border-primary/55">
      {module.image && <img src={module.image} alt="" className="absolute inset-0 size-full object-cover opacity-[0.42] transition duration-300 group-hover:scale-105" loading="lazy" />}
      <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/72 to-background/15" />
      <div className="relative flex h-full flex-col justify-end">
        <module.icon className="mb-4 size-9 text-primary drop-shadow-[0_0_10px_var(--color-primary)]" />
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold text-foreground">{module.title}</p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">{module.description}</p>
          </div>
          <ChevronRight className="size-6 shrink-0 text-foreground/80" />
        </div>
      </div>
    </Link>
  );
}