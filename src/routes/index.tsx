import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const session = window.localStorage.getItem("vrumfit:session");
      if (session) {
        try {
          const { role } = JSON.parse(session) as { role: string };
          if (role === "personal") throw redirect({ to: "/trainer" });
          if (role === "aluno") throw redirect({ to: "/student" });
          throw redirect({ to: "/owner" });
        } catch (e) {
          if (e && typeof e === "object" && "to" in e) throw e;
        }
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
