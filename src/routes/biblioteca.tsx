import { createFileRoute, Outlet } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({ meta: [{ title: "Biblioteca VrumFit — Execução" }] }),
  component: () => (
    <RequireAuth>
      <Outlet />
    </RequireAuth>
  ),
});
