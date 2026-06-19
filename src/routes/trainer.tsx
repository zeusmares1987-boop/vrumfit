import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/trainer")({
  beforeLoad: () => { throw redirect({ to: "/owner" }); },
  component: () => null,
});
