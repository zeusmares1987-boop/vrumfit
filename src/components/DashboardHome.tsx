import { Link } from "@tanstack/react-router";
import { Bell, CalendarDays, ChevronDown, ChevronRight, LayoutGrid, Search, SlidersHorizontal } from "lucide-react";
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
  beforeStats,
}: DashboardHomeProps) {
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const visibleModules = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return modules;
    return modules.filter((m) => `${m.title} ${m.description}`.toLowerCase().includes(clean));
  }, [modules, query]);

  return (
    <div className="dashboard-home dashboard-owner-screen space-y-4 pb-8 md:space-y-5">
      <Hero
        name={name}
        roleLabel={roleLabel}
        modeLabel={modeLabel}
        subtitle={subtitle}
        avatarUrl={avatarUrl}
        heroImageUrl={heroImageUrl}
        notifCount={notifCount}
      />
      <SearchRow value={query} onChange={setQuery} placeholder={searchPlaceholder} filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((v) => !v)} />
      {filtersOpen && <FilterTabs />}
      {alerts}
      {beforeStats}
      {stats.length > 0 && <StatsRow stats={stats} />}
      <SectionHeader />
      <ModuleGrid modules={visibleModules} />
    </div>
  );
}

function Hero({
  name,
  roleLabel,
  modeLabel,
  subtitle,
  avatarUrl: _avatarUrl,
  heroImageUrl: _heroImageUrl,
  notifCount,
}: {
  name: string;
  roleLabel: string;
  modeLabel: string;
  subtitle: string;
  avatarUrl: string;
  heroImageUrl: string;
  notifCount: number;
}) {
  const titleName = roleLabel === "Proprietário" ? roleLabel : name;

  return (
    <section className="dashboard-hero relative -mx-4 min-h-[312px] overflow-hidden px-6 pb-6 pt-9 md:-mx-10 md:min-h-[342px] md:px-8 md:pb-8 md:pt-10">
      <div className="dashboard-hero-grid" aria-hidden="true" />
      <div className="dashboard-hero-figure" aria-hidden="true" />

      <header className="relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 md:gap-5">
        <Brand />
        <Link
          to="/config"
          aria-label="Meu perfil"
          className="dashboard-user-chip hidden min-w-0 items-center gap-3 rounded-full py-2 pl-2 pr-4 md:flex"
        >
          <span className="dashboard-mini-avatar">{roleLabel.slice(0, 1)}</span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[23px] font-semibold text-foreground">{roleLabel}</span>
            <span className="inline-flex items-center gap-2 text-[17px] font-medium text-primary">
              {modeLabel}
              <ChevronDown className="size-4" />
            </span>
          </span>
        </Link>
        <Link to="/config" aria-label="Meu perfil" className="dashboard-avatar-button grid size-[58px] place-items-center overflow-hidden rounded-full md:hidden">
          <span className="dashboard-mini-avatar">{roleLabel.slice(0, 1)}</span>
        </Link>
        <Link to="/avisos" aria-label="Avisos" className="dashboard-bell relative grid size-[52px] place-items-center rounded-full text-foreground md:size-[58px]">
          <Bell className="size-7" />
          {notifCount > 0 && <span className="dashboard-badge">{notifCount > 9 ? "9+" : notifCount}</span>}
        </Link>
      </header>

      <div className="relative mt-14 max-w-[74%] md:mt-12 md:max-w-[58%]">
        <h1 className="dashboard-heading text-[35px] font-bold leading-[1.08] tracking-[-0.055em] text-foreground md:text-[47px]">
          {roleLabel === "Proprietário" ? "Bem-vindo," : `${greeting()},`} {" "}
          <span className="text-primary">{titleName}</span>
        </h1>
        <p className="mt-2 text-[18px] leading-snug text-muted-foreground md:text-[24px]">{subtitle}</p>
      </div>
    </section>
  );
}

function safeShortLabel(label: string) {
  if (label.length <= 11) return label;
  return `${label.slice(0, 8)}...`;
}

function Brand() {
  return (
    <div className="dashboard-brand flex min-w-0 items-center gap-3 md:gap-4">
      <VrumMark className="size-[50px] shrink-0 md:size-[72px]" />
      <div className="min-w-0 leading-none">
        <div className="dashboard-logo-text truncate text-[34px] font-black italic tracking-[-0.09em] text-foreground md:text-[45px]">
          Vrum<span className="text-primary">Fit</span>
        </div>
        <div className="dashboard-logo-sub mt-1.5 pl-6 text-[11px] font-bold tracking-[0.58em] text-foreground/90 md:pl-8 md:text-[15px]">PERSONAL</div>
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
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-5">
      {stats.map((s) => <StatCard key={s.label} stat={s} />)}
    </section>
  );
}

function statSpark(value: string) {
  const n = Number(value.replace(/\D/g, "")) || 1;
  const points = Array.from({ length: 9 }, (_, i) => {
    const seed = (n + 7) * (i + 3);
    const y = 38 - ((seed * 13) % 24);
    return `${i * 18},${y}`;
  });
  return `M${points.join(" L")}`;
}

function StatCard({ stat }: { stat: DashboardStat }) {
  return (
    <article className="dashboard-panel relative min-h-[168px] min-w-0 overflow-hidden rounded-[20px] p-5 md:min-h-[222px] md:rounded-[19px] md:p-6">
      <div className="flex items-start gap-4">
        <div className="dashboard-small-ring grid size-[58px] shrink-0 place-items-center rounded-full text-primary md:size-[64px]">
          <stat.icon className="size-8" />
        </div>
        <div className="min-w-0 pt-1">
          <p className="truncate text-[18px] font-medium text-foreground md:text-[21px]">{safeShortLabel(stat.label)}</p>
          <p className="mt-5 truncate text-[46px] font-black leading-none tracking-[-0.055em] text-foreground md:text-[52px]">{stat.value}</p>
          <p className="mt-1 truncate text-[18px] leading-none text-primary md:text-[20px]">{stat.hint}</p>
        </div>
      </div>
      <svg className="dashboard-spark" viewBox="0 0 144 48" aria-hidden="true">
        <path d={statSpark(stat.value)} />
      </svg>
    </article>
  );
}

function SearchRow({ value, onChange, placeholder, filtersOpen, onToggleFilters }: { value: string; onChange: (v: string) => void; placeholder: string; filtersOpen: boolean; onToggleFilters: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_116px] gap-3 md:grid-cols-[minmax(0,1fr)_190px] md:gap-5">
      <label className="relative">
        <Search className="absolute left-5 top-1/2 size-8 -translate-y-1/2 text-muted-foreground md:left-7 md:size-9" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="dashboard-search-box h-[66px] w-full rounded-[30px] pl-[68px] pr-4 text-[16px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/70 md:h-[78px] md:pl-[82px] md:text-[23px]"
        />
      </label>
      <button type="button" aria-pressed={filtersOpen} onClick={onToggleFilters} className="dashboard-search-box grid h-[66px] shrink-0 grid-flow-col place-content-center items-center gap-2 rounded-[30px] px-3 text-[15px] font-semibold text-primary transition hover:border-primary/60 md:h-[78px] md:gap-4 md:text-[22px]">
        <SlidersHorizontal className="size-6 md:size-8" />
        Filtros
      </button>
    </div>
  );
}

function FilterTabs() {
  const items = [
    { label: "Visão geral", icon: LayoutGrid },
    { label: "Hoje", icon: CalendarDays },
    { label: "Semana", icon: CalendarDays },
    { label: "Mês", icon: CalendarDays },
  ];

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto py-1">
      {items.map((item, index) => (
        <button key={item.label} type="button" className={cn("dashboard-filter-chip", index === 0 && "dashboard-filter-chip-active")}>
          <item.icon className="size-5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between pt-1">
      <h2 className="dashboard-section-title text-[27px] font-semibold tracking-[-0.04em] text-foreground md:text-[32px]">Módulos</h2>
      <button type="button" className="dashboard-order-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium text-primary md:text-[18px]">
        <SlidersHorizontal className="size-5" />
        Ordenar
        <ChevronDown className="size-5" />
      </button>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: DashboardModule[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
      {modules.map((m) => <ModuleCard key={m.title + m.to} module={m} />)}
    </section>
  );
}

function ModuleCard({ module }: { module: DashboardModule }) {
  return (
    <Link
      to={module.to}
      className="dashboard-module group relative min-h-[156px] overflow-hidden rounded-[18px] p-5 transition active:scale-[0.98] hover:border-primary/55 md:min-h-[180px] md:p-5"
    >
      <div className="dashboard-module-photo" aria-hidden="true" />
      <div className="dashboard-module-shade" aria-hidden="true" />
      <div className="flex items-start justify-between">
        <div className="dashboard-module-icon grid size-[56px] place-items-center rounded-full text-primary md:size-[60px]">
          <module.icon className="size-8" />
        </div>
        <ChevronRight className="relative z-10 size-8 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <div className="relative z-10 mt-10 md:mt-9">
        <p className="truncate text-[22px] font-bold leading-tight tracking-[-0.045em] text-foreground md:text-[24px]">{module.title}</p>
        <p className="mt-1 line-clamp-1 text-[15px] text-muted-foreground md:text-[17px]">{module.description}</p>
      </div>
    </Link>
  );
}
