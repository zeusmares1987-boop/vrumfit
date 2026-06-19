import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/trainer")({
  component: () => <Navigate to="/owner" />,
});
