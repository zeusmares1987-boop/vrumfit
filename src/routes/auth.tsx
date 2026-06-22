import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, ChevronRight, Mail, Phone, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import heroLoginAsset from "@/assets/hero-login.jpg.asset.json";
const heroLogin = heroLoginAsset.url;
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, roleHomePath } from "@/lib/auth";
import { bootstrapMasterOwner } from "@/lib/master-owner.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — VRUMFIT PERSONAL" },
      { name: "description", content: "Acesse o VRUMFIT PERSONAL: dono, personal ou aluno." },
    ],
  }),
  component: AuthPage,
});

type Mode = "login" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const bootstrapMasterOwnerFn = useServerFn(bootstrapMasterOwner);
  const { session, role, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [accountRole, setAccountRole] = useState<"aluno" | "personal">("aluno");
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: roleHomePath(role) });
  }, [session, role, loading, navigate]);

  const finishMasterOwnership = async (signedEmail: string) => {
    if (signedEmail.trim().toLowerCase() !== "zeusmares1987@gmail.com") return;
    const { data, error } = await supabase.rpc("claim_ownership");
    if (error || data !== true) throw error ?? new Error("Não foi possível ativar o e-mail mestre.");
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Preencha e-mail e senha.");
    setBusy(true);
    const cleanEmail = email.trim();
    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
    if (error && cleanEmail.toLowerCase() === "zeusmares1987@gmail.com") {
      try {
        await bootstrapMasterOwnerFn({ data: { email: cleanEmail, password } });
        const { error: masterLoginError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (masterLoginError) throw masterLoginError;
      } catch (claimError: any) {
        setBusy(false);
        return toast.error(claimError.message ?? "Falha ao ativar o e-mail mestre.");
      }
      setBusy(false);
      toast.success("E-mail mestre ativado.");
      navigate({ to: "/owner" });
      return;
    }
    setBusy(false);
    if (error) return toast.error(error.message);
    try {
      await finishMasterOwnership(cleanEmail);
    } catch (claimError: any) {
      return toast.error(claimError.message ?? "Falha ao ativar dono.");
    }
    toast.success("Bem-vindo!");
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return toast.error("Preencha todos os campos.");
    if (password.length < 6) return toast.error("Senha precisa ter no mínimo 6 caracteres.");
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName, phone, role: accountRole },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Você já pode entrar.");
    setMode("login");
  };

  const onForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Informe seu e-mail.");
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para seu e-mail.");
    setMode("login");
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setBusy(false);
      toast.error("Falha ao entrar com Google.");
      return;
    }
    if (result.redirected) return;
    setBusy(false);
  };

  const title = mode === "login" ? "Acesse sua conta" : mode === "signup" ? "Crie sua conta" : "Recuperar acesso";
  const subtitle = mode === "login" ? "Treinos, dieta e evolução em um só lugar." : mode === "signup" ? "Comece em menos de um minuto." : "Enviaremos um link seguro para seu e-mail.";

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden font-display text-foreground">
      <img src={heroLogin} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-center scale-105" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 60% at 50% 0%, transparent 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.96) 100%)" }} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/90 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(closest-side, rgba(255,120,30,0.28), transparent 70%)" }} />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pt-[max(env(safe-area-inset-top),2rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <div className="mt-[10vh] flex flex-col items-center">
          <h1 className="text-[40px] leading-none font-extrabold tracking-tight">
            <span className="text-white">VRUM</span><span className="text-primary">FIT</span>
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span className="h-px w-6 bg-primary/70" />
            <span className="text-[11px] tracking-[0.5em] text-primary font-semibold">PERSONAL</span>
            <span className="h-px w-6 bg-primary/70" />
          </div>
          <p className="mt-5 text-[13px] text-white/70 text-center max-w-[260px] leading-snug">{subtitle}</p>
        </div>

        <div className="mt-auto w-full max-w-md mx-auto">
          <div className="mb-4 text-center">
            <h2 className="text-lg font-semibold text-white/95 tracking-tight">{title}</h2>
          </div>

          {mode === "login" && (
            <form onSubmit={onLogin} className="flex flex-col gap-3.5">
              <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
              <Field icon={Lock} type={showPwd ? "text" : "password"} placeholder="Senha" value={password} onChange={setPassword}
                rightIcon={showPwd ? EyeOff : Eye} onRightClick={() => setShowPwd(!showPwd)} />
              <PrimaryButton disabled={busy} type="submit">{busy ? "Entrando..." : "Entrar"}</PrimaryButton>
              <button type="button" onClick={() => setMode("forgot")} className="mt-1 text-center text-[13px] font-medium text-primary/90 hover:text-primary underline underline-offset-4 decoration-primary/40">
                Esqueci minha senha
              </button>
              <div className="my-1 flex items-center gap-3 text-[11px] text-white/40">
                <span className="h-px flex-1 bg-white/10" /> OU <span className="h-px flex-1 bg-white/10" />
              </div>
              <button type="button" onClick={onGoogle} disabled={busy} className="h-12 rounded-2xl border border-white/15 bg-black/40 backdrop-blur-md flex items-center justify-center gap-3 text-sm font-medium text-white hover:bg-black/60 transition">
                <GoogleIcon /> Entrar com Google
              </button>
              <button type="button" onClick={() => setMode("signup")} className="mt-2 h-14 w-full rounded-2xl border border-primary/40 bg-black/40 backdrop-blur-md flex items-center justify-center gap-2 text-sm font-semibold text-white hover:border-primary hover:bg-primary/10 transition">
                Criar conta <ChevronRight className="size-4 text-primary" />
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={onSignup} className="flex flex-col gap-3">
              <BackBtn onClick={() => setMode("login")}>Voltar</BackBtn>
              <Field icon={User} type="text" placeholder="Nome completo" value={fullName} onChange={setFullName} />
              <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
              <Field icon={Phone} type="tel" placeholder="Telefone (opcional)" value={phone} onChange={setPhone} />
              <Field icon={Lock} type={showPwd ? "text" : "password"} placeholder="Senha (mín. 6)" value={password} onChange={setPassword}
                rightIcon={showPwd ? EyeOff : Eye} onRightClick={() => setShowPwd(!showPwd)} />
              <div className="flex gap-2">
                {(["aluno", "personal"] as const).map((r) => (
                  <button type="button" key={r} onClick={() => setAccountRole(r)} className={`flex-1 h-12 rounded-2xl border text-sm font-semibold transition ${accountRole === r ? "border-primary bg-primary/15 text-primary" : "border-white/15 bg-black/40 text-white/80 hover:border-white/30"}`}>
                    {r === "aluno" ? "Sou Aluno" : "Sou Personal"}
                  </button>
                ))}
              </div>
              <PrimaryButton disabled={busy} type="submit">{busy ? "Criando..." : "Criar conta"}</PrimaryButton>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={onForgot} className="flex flex-col gap-3.5">
              <BackBtn onClick={() => setMode("login")}>Voltar</BackBtn>
              <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
              <PrimaryButton disabled={busy} type="submit">{busy ? "Enviando..." : "Enviar link"}</PrimaryButton>
            </form>
          )}

          <p className="mt-6 text-center text-[11px] text-white/40">
            © {new Date().getFullYear()} VRUMFIT PERSONAL · Todos os direitos reservados
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  icon: Icon, type, placeholder, value, onChange, rightIcon: RightIcon, onRightClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rightIcon?: React.ComponentType<{ className?: string }>;
  onRightClick?: () => void;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-primary/80" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-14 rounded-2xl bg-black/55 backdrop-blur-md border border-white/10 pl-12 pr-12 text-sm text-white outline-none placeholder:text-white/45 focus:border-primary/60 focus:bg-black/65 transition"
      />
      {RightIcon && (
        <button type="button" onClick={onRightClick} className="absolute right-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center text-primary/80 hover:text-primary">
          <RightIcon className="size-[18px]" />
        </button>
      )}
    </div>
  );
}

function PrimaryButton({ children, disabled, type }: { children: React.ReactNode; disabled?: boolean; type?: "submit" | "button" }) {
  return (
    <button
      type={type ?? "button"}
      disabled={disabled}
      className="mt-2 h-14 w-full rounded-2xl font-bold text-[15px] tracking-wide text-white transition active:scale-[0.99] relative overflow-hidden disabled:opacity-60"
      style={{
        background: "linear-gradient(180deg, #ffb060 0%, #ff7a18 45%, #c0470a 100%)",
        boxShadow: "0 14px 40px -10px rgba(255,120,30,0.65), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 0 rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="self-start flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
      <ArrowLeft className="size-3.5" /> {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.3 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.3l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.3l6.2 5.2C40.9 35 44 30 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}
