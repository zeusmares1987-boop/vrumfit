import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "dono" | "personal" | "aluno";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

async function fetchRole(uid: string): Promise<AppRole | null> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .order("role", { ascending: true });
  if (!data || data.length === 0) return null;
  // priority: dono > personal > aluno
  const roles = data.map((r) => r.role as AppRole);
  if (roles.includes("dono")) return "dono";
  if (roles.includes("personal")) return "personal";
  return "aluno";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        const r = await fetchRole(data.session.user.id);
        if (mounted) setRole(r);
      }
      setLoading(false);
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      if (s?.user) {
        // defer to avoid deadlocks
        setTimeout(async () => {
          const r = await fetchRole(s.user.id);
          setRole(r);
        }, 0);
      } else {
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole(null);
  };

  const refreshRole = async () => {
    if (session?.user) {
      const r = await fetchRole(session.user.id);
      setRole(r);
    }
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, role, loading, signOut, refreshRole }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function roleHomePath(role: AppRole | null): string {
  if (role === "dono") return "/owner";
  if (role === "personal") return "/trainer";
  return "/student";
}
