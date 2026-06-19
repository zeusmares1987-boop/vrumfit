import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2, Package as Box } from "lucide-react";
import { toast } from "sonner";

type P = { id: string; title: string; short_desc: string | null; price_cents: number; status: string; cover_url: string | null };

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Prod />
    </RequireAuth>
  ),
});

function Prod() {
  const { role } = useAuth();
  const [list, setList] = useState<P[]>([]);
  const [form, setForm] = useState({ title: "", short_desc: "", price: "" });
  const [show, setShow] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("products").select("id,title,short_desc,price_cents,status,cover_url").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList((data ?? []) as P[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) return;
    const { error } = await supabase.from("products").insert({
      title: form.title, short_desc: form.short_desc || null,
      price_cents: Math.round(parseFloat(form.price) * 100), status: "ativo" as any,
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", short_desc: "", price: "" });
    setShow(false);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono";

  return (
    <AppShell title="Produtos" subtitle={`${list.length} no catálogo`}
      action={canEdit ? (
        <button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Plus className="size-4" />
        </button>
      ) : undefined}>
      {show && (
        <Card className="p-3">
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <input placeholder="Descrição curta" value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} className={inputCls} />
            <input placeholder="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>ADICIONAR</button>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-3 relative">
            {p.cover_url ? (
              <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 border border-white/10">
                <img src={p.cover_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ) : (
              <div className="size-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center mb-2">
                <Box className="size-4 text-primary" />
              </div>
            )}
            <p className="text-sm font-semibold leading-tight">{p.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{p.short_desc ?? "—"}</p>
            <p className="text-base font-extrabold text-primary mt-1.5">R$ {(p.price_cents / 100).toFixed(2)}</p>
            {canEdit && (
              <button onClick={() => remove(p.id)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ))}
        {list.length === 0 && <p className="col-span-2 text-center text-xs text-white/50 py-6">Sem produtos.</p>}
      </div>
    </AppShell>
  );
}
