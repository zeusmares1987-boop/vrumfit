import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";

export type NeonTileItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  to: string;
};

/**
 * Tile circular estilo "neon ring" (referência VrumFit).
 * Anel laranja com glow, ícone centralizado, label + subtítulo abaixo.
 */
export function NeonTile({ icon: Icon, label, hint, to }: NeonTileItem) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center text-center gap-2 py-2 transition active:scale-[0.97]"
    >
      <div className="neon-ring relative grid place-items-center">
        <Icon className="size-7 text-primary drop-shadow-[0_0_6px_rgba(255,120,30,0.65)] transition group-hover:scale-110" />
      </div>
      <div className="px-1">
        <p className="text-[13px] font-extrabold leading-tight text-white">{label}</p>
        <p className="text-[10.5px] text-white/55 leading-snug mt-0.5 line-clamp-1">{hint}</p>
      </div>
    </Link>
  );
}

export function NeonGrid({ items }: { items: NeonTileItem[] }) {
  return (
    <section className="grid grid-cols-3 gap-x-2 gap-y-4">
      {items.map((t) => (
        <NeonTile key={t.label} {...t} />
      ))}
    </section>
  );
}
