import { Link } from "@tanstack/react-router";
import { ChevronRight, Search, SlidersHorizontal, User as UserIcon } from "lucide-react";
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
  avatarUrl: _avatarUrl,
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
    <div className="space-y-5 pb-6">
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
    <section className="relative -mx-4 overflow-hidden px-4 pb-2 pt-4">
      {/* Imagem à direita, fade pra esquerda */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[58%]">
        <img src={heroImageUrl} alt="" className="size-full object-cover object-right opacity-60" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
      </div>

      {/* Topo: logo + avatar */}
      <header className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <Brand />
        <Link
          to="/config"
          aria-label="Meu perfil"
          className="grid size-11 shrink-0 place-items-center rounded-full border-[1.5px] border-primary/70 text-primary backdrop-blur-sm transition hover:bg-primary/10"
        >
          <UserIcon className="size-5" />
        </Link>
      </header>

      {/* Saudação */}
      <div className="relative mt-7 max-w-[78%]">
        <h1 className="text-[34px] font-black leading-[1.05] tracking-tight text-foreground">
          {greeting()},{" "}
          <span className="text-primary">{name}!</span>
        </h1>
        <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{subtitle}</p>
      </div>
    </section>
  );
}

function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_0_24px_-6px_var(--color-primary)]">
        <span className="text-xl font-black italic leading-none">V</span>
      </div>
      <div className="min-w-0 leading-none">
        <div className="truncate text-[20px] font-black italic tracking-tight text-foreground">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="mt-1 text-[8px] font-bold tracking-[0.4em] text-muted-foreground">PERSONAL</div>
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
    <article className="relative min-w-0 overflow-hidden rounded-2xl border border-border bg-card/70 p-3 backdrop-blur-sm">
      <div className="flex items-start gap-2">
        <div className="grid size-9 shrink-0 place-items-center rounded-full border border-primary/40 bg-primary/10 text-primary">
          <stat.icon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-muted-foreground">{stat.label}</p>
          <p className="truncate text-2xl font-black leading-tight tracking-tight text-foreground">{stat.value}</p>
          <p className="truncate text-[10px] text-muted-foreground">{stat.hint}</p>
        </div>
        <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground/60" />
      </div>
      <div className="pointer-events-none absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
    </article>
  );
}

function SearchRow({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <label className="relative">
        <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-2xl border border-border bg-card/70 pl-11 pr-4 text-[13px] text-foreground outline-none backdrop-blur-sm placeholder:text-muted-foreground focus:border-primary/60"
        />
      </label>
      <button type="button" className="grid h-12 shrink-0 grid-flow-col items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 text-[13px] font-semibold text-primary backdrop-blur-sm transition hover:border-primary/50">
        <SlidersHorizontal className="size-4" />
        Filtros
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {modules.map((m) => <ModuleCard key={m.title + m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      to={module.to}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-sm transition active:scale-[0.98] hover:border-primary/55"
    >
      <div className="flex items-start justify-between">
        <div className="grid size-12 place-items-center rounded-full border-[1.5px] border-primary/60 bg-primary/5 text-primary">
          <module.icon className="size-6" />
        </div>
        <ChevronRight className="size-5 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="mt-5">
        <p className="truncate text-[18px] font-extrabold leading-tight text-foreground">{module.title}</p>
        <p className="mt-1 line-clamp-1 text-[12px] text-muted-foreground">{module.description}</p>
      </div>
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </Link>
  );
}
