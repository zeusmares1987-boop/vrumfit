import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  children,
  back = "/owner",
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  back?: string;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] pb-[max(env(safe-area-inset-bottom),2rem)] font-display">
      <header className="px-5 pt-[max(env(safe-area-inset-top),2.5rem)] pb-4 flex items-center justify-between gap-3">
        <Link
          to={back}
          className="size-10 rounded-full glass grid place-items-center shrink-0"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold truncate">{title}</h1>
          {subtitle && (
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </header>
      <main className="px-5 space-y-5">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass rounded-2xl p-4 ${className}`}>{children}</section>;
}

export function Field({
  label, children,
}: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full glass rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60";

export const btnPrimary =
  "w-full rounded-xl bg-primary text-primary-foreground font-bold py-3 text-sm glow-brand hover:brightness-110 transition active:scale-[0.99]";

export const btnGhost =
  "w-full rounded-xl glass font-semibold py-3 text-sm hover:border-primary/40 transition";
