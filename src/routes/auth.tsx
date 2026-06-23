import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { User, Lock, Eye, EyeOff, Mail, Phone, ArrowLeft, Dumbbell } from "lucide-react";
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
        data: { full_name: fullName, phone, role: "aluno" },
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
    <main className="relative min-h-[100dvh] w-full overflow-hidden font-display text-foreground bg-black flex flex-col">
      {/* HERO */}
      <div className="relative w-full h-[44dvh] min-h-[300px] shrink-0">
        <img src={heroLogin} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[center_top]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black" />
      </div>

      {/* MARCA */}
      <div className="relative z-10 -mt-12 flex flex-col items-center">
        <h1 className="text-[44px] leading-none font-black tracking-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)]">
          <span className="text-white">Vrum</span><span className="text-primary">Fit</span>
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-px w-6 bg-primary/70" />
          <span className="text-[10px] tracking-[0.55em] text-white/85 font-semibold">PERSONAL</span>
          <span className="h-px w-6 bg-primary/70" />
        </div>
        <p className="mt-3 text-[14px] text-white/85">
          Seu treino. <span className="text-primary font-semibold">Sua evolução.</span>
        </p>
      </div>

      {/* FORM */}
      <div className="relative z-10 flex-1 flex flex-col px-6 pt-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          {mode === "login" && (
            <form onSubmit={onLogin} className="flex flex-col">
              <div className="flex flex-col gap-3">
                <Field icon={Mail} type="email" placeholder="E-mail ou usuário" value={email} onChange={setEmail} />
                <Field icon={Lock} type={showPwd ? "text" : "password"} placeholder="Senha" value={password} onChange={setPassword}
                  rightIcon={showPwd ? EyeOff : Eye} onRightClick={() => setShowPwd(!showPwd)} />
              </div>

              <PrimaryButton disabled={busy} type="submit">{busy ? "Entrando..." : "Entrar"}</PrimaryButton>

              <button type="button" onClick={() => setMode("signup")}
                className="mt-3 h-12 w-full rounded-2xl border border-primary/50 text-primary font-bold tracking-wide uppercase text-[14px] hover:bg-primary/10 transition">
                Criar conta
              </button>

              <button type="button" onClick={() => setMode("forgot")} className="self-center mt-3 text-[12px] font-medium text-white/55 hover:text-primary transition">
                Esqueci minha senha
              </button>

              {/* Acesso rápido */}
              <div className="mt-5">
                <div className="flex items-center gap-3 text-[10px] tracking-[0.35em] text-primary/80">
                  <span className="h-px flex-1 bg-primary/25" /> ACESSO RÁPIDO <span className="h-px flex-1 bg-primary/25" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <QuickCard icon={User} title="ALUNO" desc="Treine, evolua e alcance seus objetivos." />
                  <QuickCard icon={Dumbbell} title="PERSONAL" desc="Gerencie alunos e transforme resultados." />
                </div>
              </div>

              <div className="my-4 flex items-center gap-3 text-[10px] tracking-[0.3em] text-white/35">
                <span className="h-px flex-1 bg-white/10" /> OU <span className="h-px flex-1 bg-white/10" />
              </div>

              <button type="button" onClick={onGoogle} disabled={busy} className="h-12 rounded-xl border border-white/15 bg-white/[0.04] flex items-center justify-center gap-3 text-[13px] font-medium text-white/90 hover:bg-white/[0.08] hover:border-white/25 transition">
                <GoogleIcon /> Continuar com Google
              </button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={onSignup} className="flex flex-col gap-3">
              <Field icon={User} type="text" placeholder="Nome completo" value={fullName} onChange={setFullName} />
              <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
              <Field icon={Phone} type="tel" placeholder="Telefone (opcional)" value={phone} onChange={setPhone} />
              <Field icon={Lock} type={showPwd ? "text" : "password"} placeholder="Senha (mín. 6)" value={password} onChange={setPassword}
                rightIcon={showPwd ? EyeOff : Eye} onRightClick={() => setShowPwd(!showPwd)} />
              <PrimaryButton disabled={busy} type="submit">{busy ? "Criando..." : "Criar conta"}</PrimaryButton>
              <button type="button" onClick={() => setMode("login")} className="self-center mt-2 inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white">
                <ArrowLeft className="size-3.5" /> Voltar ao login
              </button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={onForgot} className="flex flex-col gap-3">
              <Field icon={Mail} type="email" placeholder="E-mail" value={email} onChange={setEmail} />
              <PrimaryButton disabled={busy} type="submit">{busy ? "Enviando..." : "Enviar link"}</PrimaryButton>
              <button type="button" onClick={() => setMode("login")} className="self-center mt-2 inline-flex items-center gap-1.5 text-[12px] text-white/60 hover:text-white">
                <ArrowLeft className="size-3.5" /> Voltar ao login
              </button>
            </form>
          )}

          <p className="mt-auto pt-6 text-center text-[10px] tracking-wider text-white/35">
            © {new Date().getFullYear()} VRUMFIT PERSONAL
          </p>
        </div>
      </div>
    </main>
  );
}

function QuickCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className="mx-auto size-10 rounded-full border border-primary/50 grid place-items-center text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-2 text-[12px] font-extrabold tracking-wider text-white">{title}</p>
      <p className="mt-1 text-[10.5px] text-white/55 leading-snug">{desc}</p>
    </div>
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
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 size-[16px] text-white/40 pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 rounded-xl bg-white/[0.05] pl-11 pr-11 text-[14px] text-white outline-none placeholder:text-white/40 focus:bg-white/[0.08] transition"
      />
      {RightIcon && (
        <button type="button" onClick={onRightClick} className="absolute right-2 top-1/2 -translate-y-1/2 size-8 grid place-items-center text-white/40 hover:text-white/80">
          <RightIcon className="size-[16px]" />
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
      className="mt-4 h-[56px] w-full rounded-2xl font-extrabold text-[17px] tracking-wide text-white uppercase transition active:scale-[0.99] disabled:opacity-60"
      style={{
        background: "linear-gradient(180deg, #ff8a3d 0%, #ff6b1a 100%)",
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
