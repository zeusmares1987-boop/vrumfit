import { createFileRoute, Navigate } from "@tanstack/react-router";

// Rota antiga unificada — toda gestão de produtos vive em /loja-pro.
export const Route = createFileRoute("/produtos")({
  component: () => <Navigate to="/loja-pro" />,
});
