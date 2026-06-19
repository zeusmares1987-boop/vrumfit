import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

type Role = "dono" | "personal" | "aluno";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — VRUMFIT PERSONAL" },
      { name: "description", content: "Acesse sua conta VRUMFIT PERSONAL: dono, personal ou aluno." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("dono");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    window.localStorage.setItem(
      "vrumfit:session",
      JSON.stringify({ role, email, ts: Date.now() }),
    );
    if (role === "personal") navigate({ to: "/trainer" });
    else if (role === "aluno") navigate({ to: "/student" });
    else navigate({ to: "/owner" });
  };

  const roles: { id: Role; label: string }[] = [
    { id: "dono", label: "Dono" },
    { id: "personal", label: "Personal" },
    { id: "aluno", label: "Aluno" },
  ];

  return (
    <main
      className="min-h-[100dvh] flex flex-col px-6 pt-[max(env(safe-area-inset-top),2.5rem)] pb-[max(env(safe-area-inset-bottom),2rem)] font-display"
      style={{
        backgroundImage:
          "radial-gradient(80% 60% at 50% -10%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 60%)",
      }}
    >
      <header className="mt-6 mb-10">
        <h1 className="text-[28px] leading-none font-extrabold tracking-tight">
          VRUMFIT <span className="text-primary">PERSONAL</span>
        </h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
          Plataforma de Performance
        </p>
      </header>

      <form onSubmit={submit} className="flex-1 flex flex-col gap-6 max-w-md w-full mx-auto">
        <div>
          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Tipo de acesso
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2 p-1 rounded-2xl glass">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  role === r.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@vrumfit.com"
              className="mt-2 w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground/60"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full glass rounded-2xl px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-primary/60 placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-primary text-primary-foreground font-bold py-4 text-sm tracking-wide glow-brand hover:brightness-110 transition active:scale-[0.99]"
        >
          ENTRAR
        </button>

        <button
          type="button"
          className="text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Esqueci minha senha
        </button>
      </form>

      <footer className="mt-10 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
        VRUMFIT © 2026
      </footer>
    </main>
  );
}
