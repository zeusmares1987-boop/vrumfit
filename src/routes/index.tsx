import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, roleHomePath } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-[100dvh] grid place-items-center bg-background">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/auth" />;
  return <Navigate to={roleHomePath(role)} />;
}
