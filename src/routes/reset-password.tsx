import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from "lucide-react";
import headerGymAsset from "@/assets/header-gym.jpg.asset.json";
const headerGym = headerGymAsset.url;

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — VRUMFIT" },
      { name: "description", content: "Defina uma nova senha de acesso." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else toast.error("Link inválido ou expirado. Solicite novamente.");
    });
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Senha mínima de 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada! Entre novamente.");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const strength =
    password.length === 0 ? 0 :
    password.length < 6 ? 1 :
    password.length < 10 || !/[0-9]/.test(password) ? 2 : 3;
  const strengthLabel = ["", "Fraca", "Média", "Forte"][strength];
  const strengthColor = ["bg-white/10", "bg-red-500", "bg-amber-500", "bg-emerald-500"][strength];

  return (
    <main className="min-h-[100dvh] bg-black text-white flex flex-col">
      <section className="relative overflow-hidden">
        <img src={headerGym} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/85 to-black" />
        <div className="absolute -top-20 -right-16 size-60 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative px-5 pt-8 pb-10 max-w-md mx-auto">
          <Link to="/auth" className="inline-flex items-center gap-1.5 text-[12px] text-white/70 hover:text-primary">
            <ArrowLeft className="size-3.5" /> Voltar para entrar
          </Link>
          
          <p className="mt-4 text-[10px] uppercase tracking-[0.32em] text-primary font-bold">Recuperação</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Crie uma nova senha</h1>
          <p className="mt-1.5 text-[13px] text-white/65 leading-snug">
            Escolha uma senha forte para proteger sua conta VRUMFIT.
          </p>
        </div>
      </section>

      <section className="flex-1 px-5 pb-10 max-w-md mx-auto w-full">
        <form onSubmit={onSubmit} className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
          <Field
            label="Nova senha"
            value={password}
            onChange={setPassword}
            show={show}
            onToggle={() => setShow((v) => !v)}
            disabled={!ready || busy}
          />

          {password && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full ${strengthColor} transition-all`} style={{ width: `${(strength / 3) * 100}%` }} />
              </div>
              <p className="text-[10px] text-white/60">Força: <span className="font-bold text-white">{strengthLabel}</span></p>
            </div>
          )}

          <Field
            label="Confirmar senha"
            value={confirm}
            onChange={setConfirm}
            show={show}
            onToggle={() => setShow((v) => !v)}
            disabled={!ready || busy}
          />

          <button
            type="submit"
            disabled={!ready || busy}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-extrabold text-[13px] tracking-wide hover:opacity-95 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="size-4" />
            {busy ? "SALVANDO..." : "SALVAR NOVA SENHA"}
          </button>

          {!ready && (
            <p className="text-[11px] text-amber-400/90 text-center">
              Link inválido ou expirado. <Link to="/auth" className="underline">Solicitar novo</Link>.
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-[10px] text-white/40">
          © {new Date().getFullYear()} VRUMFIT — Treine com inteligência.
        </p>
      </section>
    </main>
  );
}

function Field({
  label, value, onChange, show, onToggle, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{label}</span>
      <div className="mt-1.5 relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="new-password"
          className="w-full h-12 rounded-2xl bg-black/60 border border-white/10 pl-11 pr-11 text-[14px] outline-none placeholder:text-white/35 focus:border-primary/60 disabled:opacity-50 transition"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 size-8 grid place-items-center rounded-lg text-white/55 hover:text-primary"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </label>
  );
}
