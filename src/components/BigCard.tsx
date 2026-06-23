import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";

export type BigCardItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  to: string;
};

/** Card grande estilo MFit: círculo laranja + texto. Fácil de mexer. */
export function BigCard({ icon: Icon, label, to }: BigCardItem) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl bg-surface border border-white/8 p-4 min-h-[76px] active:scale-[0.98] hover:border-primary/40 hover:bg-surface-2 transition"
    >
      <span className="shrink-0 size-12 rounded-full bg-primary/15 border border-primary/40 grid place-items-center text-primary">
        <Icon className="size-6" />
      </span>
      <span className="min-w-0 text-[15px] font-bold leading-tight text-white">{label}</span>
    </Link>
  );
}

export function BigCardGrid({ items }: { items: BigCardItem[] }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {items.map((t) => (
        <BigCard key={t.label} {...t} />
      ))}
    </section>
  );
}
