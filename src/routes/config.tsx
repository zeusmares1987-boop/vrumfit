import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, Field, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Settings as SettingsIcon, LogOut, Mail, User } from "lucide-react";

export const Route = createFileRoute("/config")({
  head: () => ({ meta: [{ title: "Configurações — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Cfg />
    </RequireAuth>
  ),
});

function Cfg() {
  const nav = useNavigate();
  const { user, signOut, role } = useAuth();
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

  const initials = (form.full_name || form.email || "?").split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  return (
    <AppShell title="Configurações">
      <PageHero
        eyebrow="Perfil"
        title="Configurações"
        subtitle="Gerencie seus dados pessoais"
        icon={SettingsIcon}
      />

      <Card className="p-4">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Carregando…</p>
        ) : (
          <form className="space-y-4" onSubmit={save}>
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 grid place-items-center text-primary font-black text-xl overflow-hidden shrink-0">
                {form.avatar_url
                  ? <img src={form.avatar_url} alt="" className="size-full object-cover" />
                  : initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-primary font-bold">{role ?? "—"}</p>
                <p className="text-sm font-bold truncate">{form.full_name || "Sem nome"}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="size-2.5" />{form.email}
                </p>
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
            <button disabled={saving} className={btnPrimary}>{saving ? "SALVANDO…" : "SALVAR PERFIL"}</button>
          </form>
        )}
      </Card>

      <button
        onClick={logout}
        className="w-full rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive font-bold py-3.5 text-sm flex items-center justify-center gap-2 hover:bg-destructive/10 transition"
      >
        <LogOut className="size-4" /> SAIR DA CONTA
      </button>
    </AppShell>
  );
}
