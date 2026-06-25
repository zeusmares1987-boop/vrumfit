import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, BarChart3, MessageCircle, LayoutGrid, LogOut, ChevronLeft } from "lucide-react";
import { useAuth, roleHomePath } from "@/lib/auth";
import { useRealtimePush } from "@/hooks/useRealtimePush";
import { cn } from "@/lib/utils";
import type { ReactNode, InputHTMLAttributes } from "react";

export function AppShell({
  title,
  subtitle,
  children,
  hideBottomNav,
  hideHeader,
  rightAction,
  action,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
  rightAction?: ReactNode;
  /** alias compatível com versões antigas das rotas */
  action?: ReactNode;
}) {
  const { role, session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  useRealtimePush();

  // Auto-protect: anyone using AppShell must be signed in
  if (!loading && !session) {
    return <Navigate to="/auth" />;
  }
  if (loading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const home = roleHomePath(role);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const showBack = path !== home && path !== "/";
  const onBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
    else navigate({ to: home });
  };

  return (
    <div className="min-h-[100dvh] bg-background font-display text-foreground pb-24">
      {!hideHeader && (
        <header className="sticky top-0 z-40 bg-gradient-to-b from-background/95 to-background/60 backdrop-blur-xl border-b border-primary/15">
          <div className="max-w-md md:max-w-[941px] mx-auto px-4 py-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {showBack && (
                <button onClick={onBack} aria-label="Voltar" title="Voltar" className="size-9 grid place-items-center rounded-xl bg-muted/40 hover:bg-primary/20 text-muted-foreground hover:text-primary transition shrink-0">
                  <ChevronLeft className="size-5" />
                </button>
              )}
              <Link to={home} className="flex items-center gap-2 shrink-0">
                <div className="leading-tight">
                  <div className="text-[15px] font-extrabold tracking-tight">
                    <span className="text-foreground">VRUM</span><span className="text-primary drop-shadow-[0_0_8px_var(--color-primary)]">FIT</span>
                  </div>
                  <div className="text-[9px] font-semibold tracking-[0.3em] text-primary/80">PERSONAL</div>
                </div>
              </Link>
            </div>
            <div className="min-w-0">
              {title && <h1 className="text-sm font-semibold truncate">{title}</h1>}
              {subtitle && <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {rightAction ?? action}
              <button onClick={onSignOut} title="Sair" aria-label="Sair" className="size-9 grid place-items-center rounded-xl bg-muted/40 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`w-full max-w-md md:max-w-[941px] mx-auto px-4 md:px-10 pb-24 ${hideHeader ? "pt-0" : "pt-4"} flex flex-col gap-4 page-enter`}>{children}</main>

      {!hideBottomNav && <BottomNav role={role} />}
    </div>
  );
}

function BottomNav({ role }: { role: "dono" | "personal" | "aluno" | null }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const home = role === "aluno" ? "/student" : role === "personal" ? "/trainer" : "/owner";
  const reports = role === "dono" ? "/financeiro" : "/evolucao";
  const items = [
    { to: home, label: "Início", icon: Home },
    { to: "/agenda", label: "Agenda", icon: CalendarDays },
    { to: reports, label: "Relatórios", icon: BarChart3 },
    { to: "/avisos", label: "Mensagens", icon: MessageCircle },
    { to: "/config", label: "Mais", icon: LayoutGrid },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
        <div className="pointer-events-auto max-w-md md:max-w-[941px] mx-auto px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <div className="rounded-t-3xl border border-b-0 border-border bg-card/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] flex items-end justify-around px-1 pt-2 pb-2">
          {items.map((it) => {
            const active = path === it.to || (it.to === home && path === "/");
            return (
              <Link key={it.to} to={it.to} className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <it.icon className="size-[20px]" />
                <span className="text-[10px] font-semibold tracking-wide">{it.label}</span>
                {active && <span className="h-[3px] w-7 rounded-full bg-primary shadow-[0_0_10px_var(--color-primary)]" />}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ============ Helpers de UI compartilhados pelas rotas ============ */

export const inputCls =
  "w-full h-11 rounded-xl bg-background/60 border border-border px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-background/80 transition";

export const btnPrimary =
  "h-11 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-primary-foreground transition active:scale-[0.99] bg-gradient-to-b from-primary to-[color-mix(in_oklab,var(--brand)_70%,black)] shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--brand)_70%,transparent),inset_0_1px_0_color-mix(in_oklab,white_22%,transparent)] hover:shadow-[0_14px_32px_-10px_color-mix(in_oklab,var(--brand)_85%,transparent)] disabled:opacity-60";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl bg-card/60 border border-primary/15 backdrop-blur-sm shadow-[0_10px_30px_-20px_black] p-4", className)}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <div className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
