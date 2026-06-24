import { Link, Navigate, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, BarChart3, MessageCircle, LayoutGrid, LogOut, ChevronLeft } from "lucide-react";
import { useAuth, roleHomePath } from "@/lib/auth";
import { useRealtimePush } from "@/hooks/useRealtimePush";
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
        <header className="sticky top-0 z-40 bg-gradient-to-b from-black/90 to-black/60 backdrop-blur-md border-b border-white/5">
          <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-2">
            {showBack && (
              <button onClick={onBack} aria-label="Voltar" title="Voltar" className="size-9 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition shrink-0">
                <ChevronLeft className="size-5" />
              </button>
            )}
            <Link to={home} className="flex items-center gap-2 shrink-0">
              <div className="leading-tight">
                <div className="text-[15px] font-extrabold tracking-tight">
                  <span className="text-white">VRUM</span><span className="text-primary">FIT</span>
                </div>
                <div className="text-[9px] font-semibold tracking-[0.3em] text-primary/80">PERSONAL</div>
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              {title && <h1 className="text-sm font-semibold truncate">{title}</h1>}
              {subtitle && <p className="text-[11px] text-white/55 truncate">{subtitle}</p>}
            </div>
            {rightAction ?? action}
            <button onClick={onSignOut} title="Sair" className="size-9 grid place-items-center rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition">
              <LogOut className="size-4" />
            </button>
          </div>
        </header>
      )}

      <main className={`max-w-md mx-auto px-4 ${hideHeader ? "pt-0" : "pt-4"}`}>{children}</main>

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
      <div className="pointer-events-auto max-w-md mx-auto px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
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
  "w-full h-11 rounded-xl bg-black/40 border border-white/10 px-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-primary/60 focus:bg-black/55 transition";

export const btnPrimary =
  "h-11 px-4 rounded-xl text-sm font-semibold text-white transition active:scale-[0.99] bg-gradient-to-b from-[#ffb060] via-[#ff7a18] to-[#c0470a] shadow-[0_10px_28px_-10px_rgba(255,120,30,0.6),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_0_rgba(0,0,0,0.25)] disabled:opacity-60";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm ${className}`}>
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
      <div className="text-[11px] font-semibold tracking-wide text-white/70 uppercase mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[11px] text-white/45 mt-1">{hint}</div>}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}
