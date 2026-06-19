import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/loja-pro/config")({
  head: () => ({ meta: [{ title: "Loja — Configurações" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <Config />
    </RequireAuth>
  ),
});

function Config() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    display_name: "",
    logo_url: "",
    whatsapp: "",
    bio: "",
    specialty: "",
    slug: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("store_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        setForm({
          display_name: data.display_name ?? "",
          logo_url: data.logo_url ?? "",
          whatsapp: data.whatsapp ?? "",
          bio: data.bio ?? "",
          specialty: data.specialty ?? "",
          slug: data.slug ?? "",
          active: data.active ?? true,
        });
      }
    })();
  }, [user?.id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = { user_id: user.id, ...form, slug: form.slug || null };
    const { error } = await supabase.from("store_settings").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  };

  return (
    <AppShell title="Loja" subtitle="Configurações públicas">
      <Card className="p-4">
        <form onSubmit={save} className="space-y-2">
          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Nome público</label>
          <input className={inputCls} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />

          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">WhatsApp comercial *</label>
          <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="ex: 11999998888" />

          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Especialidade</label>
          <input className={inputCls} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />

          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Bio</label>
          <textarea className={`${inputCls} min-h-24`} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />

          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">URL do logo</label>
          <input className={inputCls} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />

          <label className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Slug público</label>
          <input className={inputCls} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />

          <label className="flex items-center gap-2 text-sm mt-2">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Loja ativa (aparece na vitrine)
          </label>

          <button disabled={saving} className={`${btnPrimary} w-full mt-2`}>{saving ? "SALVANDO…" : "SALVAR"}</button>
        </form>
      </Card>
    </AppShell>
  );
}
