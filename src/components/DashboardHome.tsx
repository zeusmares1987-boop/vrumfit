import { Link } from "@tanstack/react-router";
import { Bell, ChevronRight, Search } from "lucide-react";
import { useMemo, useState, type ComponentType, type ReactNode } from "react";

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
  notifCount = 0,
  alerts,
}: DashboardHomeProps) {
  const [query, setQuery] = useState("");

  const visibleModules = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return modules;
    return modules.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(clean));
  }, [modules, query]);

  return (
    <div className="pb-6">
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
    <section className="relative -mx-4 overflow-hidden bg-background px-4 pb-4 pt-3">
      <div className="absolute inset-0">
        <img src={heroImageUrl} alt="" className="size-full object-cover opacity-25" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      {/* Linha 1: marca + ações */}
      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Brand />
        <div className="flex shrink-0 items-center gap-2">
          <button aria-label="Notificações" className="relative grid size-10 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition hover:text-primary">
            <Bell className="size-[18px]" />
            {notifCount > 0 && <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground">{notifCount}</span>}
          </button>
          <img src={avatarUrl} alt="" className="size-10 rounded-full border-2 border-primary object-cover shadow-[0_0_18px_-6px_var(--color-primary)]" />
        </div>
      </header>

      {/* Linha 2: boas-vindas */}
      <div className="relative mt-5 rounded-3xl border border-border bg-card/40 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-primary/50 bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">{roleLabel}</span>
          <span className="inline-flex items-center rounded-full border border-border bg-card/70 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {modeLabel}
          </span>
        </div>
        <h1 className="mt-2 text-[26px] font-black leading-tight tracking-tight text-foreground">
          Bem-vindo, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>

      {/* Linha 3: busca */}
      <div className="relative mt-3">
        <label className="relative flex-1">
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-full border border-border bg-card/80 pl-11 pr-4 text-[13px] text-foreground outline-none backdrop-blur placeholder:text-muted-foreground focus:border-primary/70"
          />
        </label>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center">
      <div className="min-w-0 leading-none">
        <div className="truncate text-lg font-black italic tracking-tight text-foreground">Vrum<span className="text-primary">Fit</span></div>
        <div className="mt-0.5 text-[8px] font-bold tracking-[0.35em] text-muted-foreground">PERSONAL</div>
      </div>
    </div>
  );
}

function StatsGrid({ stats }: { stats: DashboardStat[] }) {
  return (
    <section className="mt-4 grid grid-cols-3 gap-2">
      {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
    </section>
  );
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-card/80 p-3 shadow-[0_14px_40px_-34px_var(--color-primary)]">
      <div className="flex items-center justify-between gap-1">
        <div className="grid size-8 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <stat.icon className="size-4" />
        </div>
        <span className="truncate text-[10px] font-bold text-primary">{stat.trend}</span>
      </div>
      <p className="mt-3 truncate text-[10px] text-muted-foreground">{stat.label}</p>
      <p className="mt-0.5 truncate text-xl font-black tracking-tight text-foreground">{stat.value}</p>
      <p className="truncate text-[10px] text-primary">{stat.hint}</p>
    </article>
  );
}

function ModuleSection({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="border-l-4 border-primary pl-3 text-lg font-bold text-foreground">Módulos</h2>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {modules.map((module) => <ModuleCard key={module.title} module={module} />)}
      </div>
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link to={module.to} className="group relative aspect-[0.86] overflow-hidden rounded-2xl border border-border bg-card transition active:scale-[0.98] hover:border-primary/55">
      {module.image && <img src={module.image} alt="" className="absolute inset-0 size-full object-cover opacity-[0.55] transition duration-300 group-hover:scale-105" loading="lazy" />}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/58 to-background/10" />
      <div className="relative flex h-full flex-col p-2.5">
        <div className="grid size-8 place-items-center rounded-full border border-primary/35 bg-background/65 text-primary backdrop-blur">
          <module.icon className="size-4 drop-shadow-[0_0_8px_var(--color-primary)]" />
        </div>
        <div className="mt-auto">
          <p className="line-clamp-2 text-[12px] font-extrabold leading-tight text-foreground">{module.title}</p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <p className="line-clamp-1 text-[9px] leading-tight text-muted-foreground">{module.description}</p>
            <ChevronRight className="size-3.5 shrink-0 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}