import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexRedirect,
});

function IndexRedirect() {
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("vrumfit:session");
      if (raw) {
        const { role } = JSON.parse(raw) as { role?: string };
        if (role === "personal") return <Navigate to="/trainer" />;
        if (role === "aluno") return <Navigate to="/student" />;
        return <Navigate to="/owner" />;
      }
    } catch {}
  }
  return <Navigate to="/login" />;
}
