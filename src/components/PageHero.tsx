import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;

type Stat = { label: string; value: string | number };

export function PageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  stats,
  action,
  bg = headerGym,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  stats?: Stat[];
  action?: React.ReactNode;
  bg?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10">
      <div className="absolute inset-0">
        <img src={bg} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-black/85" />
        <div className="absolute -top-16 -right-16 size-56 rounded-full bg-primary/30 blur-3xl" />
      </div>
      <div className="relative p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] uppercase tracking-[0.32em] text-primary font-bold">{eyebrow}</p>
            )}
            <div className="mt-1 flex items-center gap-2.5">
              {Icon && (
                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur-sm shadow-[0_0_24px_-8px_var(--brand)]">
                  <Icon className="size-5 text-primary" />
                </span>
              )}
              <h1 className="truncate text-2xl font-black tracking-tight text-foreground">{title}</h1>
            </div>
            {subtitle && (
              <p className="mt-1.5 text-[12px] text-muted-foreground leading-snug">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {stats && stats.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-primary/15 bg-background/40 backdrop-blur-sm px-3 py-2">
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
                <p className="text-base font-extrabold text-foreground mt-0.5 truncate">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="glass rounded-3xl py-10 px-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/15 border border-primary/30">
        <Icon className="size-6 text-primary" />
      </div>
      <p className="mt-3 text-sm font-bold text-foreground">{title}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
