import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/config")({
  head: () => ({ meta: [{ title: "Configurações — VRUMFIT" }] }),
  component: Cfg,
});

function Cfg() {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", avatar_url: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles").select("full_name,email,phone,avatar_url").eq("id", user.id).maybeSingle();
      if (data) setForm({
        full_name: data.full_name ?? "",
        email: data.email ?? user.email ?? "",
        phone: data.phone ?? "",
        avatar_url: data.avatar_url ?? "",
      });
      setLoading(false);
    })();
  }, [user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name, phone: form.phone, avatar_url: form.avatar_url || null,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado!");
  };

  const logout = async () => {
    await signOut();
    nav({ to: "/auth" });
  };

  return (
    <AppShell title="Configurações" subtitle="Seu perfil">
      <Card className="p-3">
        {loading ? <p className="text-xs text-white/50">Carregando…</p> : (
          <form className="space-y-3" onSubmit={save}>
            <div className="flex items-center gap-3">
              <div className="size-16 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold text-xl overflow-hidden">
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="" className="size-full object-cover" />
                  : (form.full_name || form.email || "?")[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase text-white/50">Email</p>
                <p className="text-sm font-semibold truncate">{form.email}</p>
              </div>
            </div>
            <Field label="Nome completo">
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Telefone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </Field>
            <Field label="URL do avatar" hint="Cole o link de uma imagem pública">
              <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className={inputCls} placeholder="https://…" />
            </Field>
            <button disabled={saving} className={btnPrimary}>{saving ? "SALVANDO…" : "SALVAR"}</button>
          </form>
        )}
      </Card>

      <button onClick={logout} className="w-full rounded-xl glass text-destructive font-semibold py-3 text-sm">
        SAIR DA CONTA
      </button>
    </AppShell>
  );
}
