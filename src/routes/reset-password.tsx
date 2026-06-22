import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase coloca o token de recuperação no hash da URL
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    // fallback: se já existe sessão de recovery
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

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h1 className="text-2xl font-bold text-white">Nova senha</h1>
        <div className="space-y-2">
          <Label className="text-white">Nova senha</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={!ready || busy} />
        </div>
        <div className="space-y-2">
          <Label className="text-white">Confirmar senha</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={!ready || busy} />
        </div>
        <Button type="submit" disabled={!ready || busy} className="w-full bg-[#FF6B1A] hover:bg-[#FF6B1A]/90">
          {busy ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
