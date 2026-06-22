import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2, Package as Box, Search, X } from "lucide-react";
import { toast } from "sonner";

type P = { id: string; title: string; short_desc: string | null; price_cents: number; status: string; cover_url: string | null };

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["dono"]}>
      <Prod />
    </RequireAuth>
  ),
});

function Prod() {
  const { role } = useAuth();
  const [list, setList] = useState<P[]>([]);
  const [form, setForm] = useState({ title: "", short_desc: "", price: "" });
  const [show, setShow] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("products").select("id,title,short_desc,price_cents,status,cover_url").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList((data ?? []) as P[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("products").insert({
      title: form.title,
      short_desc: form.short_desc || null,
      price_cents: Math.round(parseFloat(form.price) * 100),
      status: "ativo" as any,
      offer_type: "digital",
      seller_id: u.user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", short_desc: "", price: "" });
    setShow(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono";
  const filtered = list.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
  const totalReceita = list.reduce((a, b) => a + b.price_cents, 0);

  return (
    <AppShell title="Produtos">
      <PageHero
        eyebrow="Catálogo"
        title="Produtos"
        subtitle={`${list.length} no catálogo`}
        icon={Box}
        stats={[
          { label: "Itens", value: list.length },
          { label: "Ativos", value: list.filter((p) => p.status === "ativo").length },
          { label: "Ticket médio", value: `R$ ${list.length ? (totalReceita / list.length / 100).toFixed(0) : "0"}` },
        ]}
        action={canEdit ? (
          <button
            onClick={() => setShow(!show)}
            className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/40 hover:scale-105 transition"
          >
            {show ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
        ) : undefined}
      />

      {show && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">Novo produto</p>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <input placeholder="Descrição curta" value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} className={inputCls} />
            <input placeholder="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>ADICIONAR</button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar produto…"
          className="w-full glass rounded-2xl pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Box}
          title={q ? "Nenhum produto encontrado" : "Sem produtos"}
          hint={canEdit ? "Toque no + para adicionar o primeiro." : undefined}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="group glass rounded-2xl p-3 relative hover:border-primary/40 hover:translate-y-[-2px] transition">
              {p.cover_url ? (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 border border-white/10">
                  <img src={p.cover_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div className="w-full aspect-square rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-transparent grid place-items-center mb-2">
                  <Box className="size-8 text-primary/70" />
                </div>
              )}
              <p className="text-sm font-bold leading-tight line-clamp-2">{p.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 min-h-[28px]">{p.short_desc ?? "—"}</p>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-base font-extrabold text-primary">R$ {(p.price_cents / 100).toFixed(2)}</p>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                  p.status === "ativo" ? "bg-success/20 text-success" : "bg-muted/30 text-muted-foreground"
                }`}>{p.status}</span>
              </div>
              {canEdit && (
                <button onClick={() => remove(p.id)} className="absolute top-2 right-2 size-7 rounded-full bg-black/60 backdrop-blur grid place-items-center text-white/70 hover:text-destructive opacity-0 group-hover:opacity-100 transition">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
