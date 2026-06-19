import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { User, Lock, Eye, EyeOff, ChevronRight } from "lucide-react";
import heroLogin from "@/assets/hero-login.jpg";
import logoV from "@/assets/logo-v.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — VRUMFIT PERSONAL" },
      { name: "description", content: "Acesse o VRUMFIT PERSONAL: dono, personal ou aluno." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    // Detecta o papel pelo e-mail enquanto não há backend real.
    const role = email.includes("aluno")
      ? "aluno"
      : email.includes("personal") || email.includes("professor")
      ? "personal"
      : "dono";
    window.localStorage.setItem(
      "vrumfit:session",
      JSON.stringify({ role, email, ts: Date.now() }),
    );
    if (role === "personal") navigate({ to: "/trainer" });
    else if (role === "aluno") navigate({ to: "/student" });
    else navigate({ to: "/owner" });
  };

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden font-display text-foreground">
      {/* Hero background */}
      <img
        src={heroLogin}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Vignettes for legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 60% at 50% 0%, transparent 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.92) 100%)",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/85 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pt-[max(env(safe-area-inset-top),3rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        {/* Logo + wordmark */}
        <div className="mt-[18vh] flex flex-col items-center">
          <img
            src={logoV}
            alt="VRUMFIT"
            width={140}
            height={140}
            className="size-[120px] drop-shadow-[0_8px_30px_rgba(255,140,40,0.45)]"
          />
          <h1 className="mt-3 text-[40px] leading-none font-extrabold tracking-tight">
            <span className="text-white">VRUM</span>
            <span className="text-primary">FIT</span>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-6 bg-primary/70" />
            <span className="text-[11px] tracking-[0.5em] text-primary font-semibold">
              PERSONAL
            </span>
            <span className="h-px w-6 bg-primary/70" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="mt-auto flex flex-col gap-3.5 w-full max-w-md mx-auto">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-primary/80" />
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail ou usuário"
              className="w-full h-14 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 pl-12 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-primary/60 focus:bg-black/65 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-primary/80" />
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full h-14 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 pl-12 pr-12 text-sm text-white outline-none placeholder:text-white/45 focus:border-primary/60 focus:bg-black/65 transition"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center text-primary/80 hover:text-primary"
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPwd ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>

          <button
            type="submit"
            className="mt-2 h-14 w-full rounded-2xl font-bold text-[15px] tracking-wide text-white transition active:scale-[0.99] relative overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, #ffb060 0%, #ff7a18 45%, #c0470a 100%)",
              boxShadow:
                "0 14px 40px -10px rgba(255,120,30,0.65), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.25)",
            }}
          >
            <span className="relative z-10">Entrar</span>
            <span
              className="absolute inset-x-6 -bottom-3 h-6 rounded-full blur-2xl opacity-80"
              style={{ background: "rgba(255,150,50,0.7)" }}
            />
          </button>

          <button
            type="button"
            className="mt-1 text-center text-[13px] font-medium text-primary/90 hover:text-primary underline underline-offset-4 decoration-primary/40"
          >
            Esqueci minha senha
          </button>

          <Link
            to="/login"
            className="mt-2 h-14 w-full rounded-2xl border border-primary/40 bg-black/40 backdrop-blur-md flex items-center justify-center gap-2 text-sm font-semibold text-white hover:border-primary transition"
          >
            Criar conta
            <ChevronRight className="size-4 text-primary" />
          </Link>
        </form>
      </div>
    </main>
  );
}
