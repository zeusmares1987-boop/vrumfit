import { Navigate } from "@tanstack/react-router";
import { useAuth, type AppRole, roleHomePath } from "@/lib/auth";
import type { ReactNode } from "react";

export function RequireAuth({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: AppRole[];
}) {
  const { session, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;
  if (allow && role && !allow.includes(role)) return <Navigate to={roleHomePath(role)} />;
  return <>{children}</>;
}
