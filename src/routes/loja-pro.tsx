import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2, Pause, Play, Edit3, Eye, AlertCircle, Settings, Store } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

const OFFER_TYPES = [
  { v: "digital", l: "Produto digital" },
  { v: "treino", l: "Treino personalizado" },
  { v: "dieta", l: "Dieta personalizada" },
  { v: "treino_dieta", l: "Treino + Dieta" },
  { v: "consultoria", l: "Consultoria online" },
  { v: "avaliacao", l: "Avaliação física" },
  { v: "acompanhamento", l: "Acompanhamento mensal" },
  { v: "presencial", l: "Serviço presencial" },
];

type Offer = {
  id: string;
  title: string;
  price_cents: number;
  status: string;
  cover_url: string | null;
  offer_type: string;
  wa_clicks: number;
};

type Plan = { id: string; max_offers: number | null; name: string };

export const Route = createFileRoute("/loja-pro")({
  head: () => ({ meta: [{ title: "Minhas Ofertas — VRUMFIT" }] }),
  component: () => (
    <RequireAuth allow={["personal", "dono"]}>
      <Panel />
    </RequireAuth>
  ),
});

function Panel() {
  const { user } = useAuth();
  const [list, setList] = useState<Offer[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [form, setForm] = useState({
    title: "",
    offer_type: "digital",
    price: "",
    short_desc: "",
    long_desc: "",
    cover_url: "",
    benefits: "",
    for_whom: "",
    included: "",
    delivery_days: "",
    whatsapp: "",
  });

  const load = async () => {
    if (!user) return;
    const [{ data: prods }, { data: sub }, { data: store }] = await Promise.all([
      supabase
        .from("products")
        .select("id,title,price_cents,status,cover_url,offer_type,wa_clicks")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("plan_id, plans!inner(id,name,max_offers,role_target)")
        .eq("user_id", user.id)
        .in("status", ["trial", "ativo"])
        .maybeSingle(),
      supabase.from("store_settings").select("whatsapp").eq("user_id", user.id).maybeSingle(),
    ]);
    setList((prods ?? []) as Offer[]);
    const pl = (sub as any)?.plans;
    setPlan(pl && pl.role_target === "professor" ? { id: pl.id, max_offers: pl.max_offers, name: pl.name } : null);
    if (store?.whatsapp && !form.whatsapp) setForm((f) => ({ ...f, whatsapp: store.whatsapp as string }));
  };

  useEffect(() => {
    load(); // eslint-disable-next-line
  }, [user?.id]);

  const reset = () => {
    setEditing(null);
    setShow(false);
    setForm({
      title: "",
      offer_type: "digital",
      price: "",
      short_desc: "",
      long_desc: "",
      cover_url: "",
      benefits: "",
      for_whom: "",
      included: "",
      delivery_days: "",
      whatsapp: form.whatsapp,
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.price) return toast.error("Título e preço são obrigatórios");
    if (!form.whatsapp) return toast.error("Informe um WhatsApp para contato");
    const payload = {
      seller_id: user.id,
      title: form.title,
      offer_type: form.offer_type,
      price_cents: Math.round(parseFloat(form.price) * 100),
      short_desc: form.short_desc || null,
      long_desc: form.long_desc || null,
      cover_url: form.cover_url || null,
      benefits: form.benefits ? form.benefits.split("\n").map((b) => b.trim()).filter(Boolean) : null,
      for_whom: form.for_whom || null,
      included: form.included || null,
      delivery_days: form.delivery_days ? parseInt(form.delivery_days) : null,
      whatsapp: form.whatsapp,
      status: "ativo" as const,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Oferta atualizada" : "Oferta publicada");
    reset();
    load();
  };

  const edit = async (o: Offer) => {
    const { data } = await supabase.from("products").select("*").eq("id", o.id).maybeSingle();
    if (!data) return;
    setEditing(o);
    setShow(true);
    setForm({
      title: data.title ?? "",
      offer_type: (data as any).offer_type ?? "digital",
      price: ((data.price_cents ?? 0) / 100).toString(),
      short_desc: data.short_desc ?? "",
      long_desc: (data as any).long_desc ?? "",
      cover_url: data.cover_url ?? "",
      benefits: (data.benefits ?? []).join("\n"),
      for_whom: (data as any).for_whom ?? "",
      included: (data as any).included ?? "",
      delivery_days: (data as any).delivery_days?.toString() ?? "",
      whatsapp: (data as any).whatsapp ?? form.whatsapp,
    });
  };

  const toggle = async (o: Offer) => {
    const next = o.status === "ativo" ? "pausado" : "ativo";
    const { error } = await supabase.from("products").update({ status: next as any }).eq("id", o.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta oferta?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const ativos = list.filter((o) => o.status === "ativo").length;
  const limite = plan?.max_offers ?? 0;
  const canPublish = !!plan && ativos < limite;
  const totalClicks = list.reduce((s, o) => s + (o.wa_clicks ?? 0), 0);

  return (
    <AppShell
      title="Minhas Ofertas"
      subtitle={`${ativos}/${limite || "—"} ativas · ${totalClicks} cliques`}
      action={
        <Link to="/loja-pro/config" className="size-10 rounded-full bg-white/5 grid place-items-center" aria-label="Configurações">
          <Settings className="size-4" />
        </Link>
      }
    >
      <PageHero
        eyebrow="Profissional"
        title="Minhas Ofertas"
        subtitle="Publique até 5 anúncios e receba contatos direto no seu WhatsApp."
        icon={Store}
        stats={[
          { label: "Ativas", value: `${ativos}/${limite || "—"}` },
          { label: "Total", value: list.length },
          { label: "Cliques", value: totalClicks },
        ]}
      />

      {!plan && (
        <Card className="p-3 flex items-start gap-3 border-destructive/40 bg-destructive/5">
          <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[12px] leading-snug">
            Você não tem o plano <b>Ofertas do Professor</b> ativo. Assine em{" "}
            <Link to="/planos" className="text-primary underline">/planos</Link> para publicar até 5 anúncios.
          </div>
        </Card>
      )}

      <button
        onClick={() => {
          if (!canPublish && !editing) return toast.error("Sem plano ativo ou limite atingido");
          setShow(!show);
        }}
        className={`${btnPrimary} w-full flex items-center justify-center gap-2`}
        disabled={!canPublish && !editing && !show}
      >
        <Plus className="size-4" /> {show ? "FECHAR" : "NOVA OFERTA"}
      </button>

      {show && (
        <Card className="p-3">
          <form onSubmit={save} className="space-y-2">
            <select
              value={form.offer_type}
              onChange={(e) => setForm({ ...form, offer_type: e.target.value })}
              className={inputCls}
            >
              {OFFER_TYPES.map((t) => (
                <option key={t.v} value={t.v}>{t.l}</option>
              ))}
            </select>
            <input placeholder="Título da oferta *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <input placeholder="Preço (R$) *" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <input placeholder="WhatsApp (com DDD) *" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputCls} />
            <input placeholder="URL da capa (opcional)" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className={inputCls} />
            <input placeholder="Descrição curta" value={form.short_desc} onChange={(e) => setForm({ ...form, short_desc: e.target.value })} className={inputCls} />
            <textarea placeholder="Descrição completa" value={form.long_desc} onChange={(e) => setForm({ ...form, long_desc: e.target.value })} className={`${inputCls} min-h-24`} />
            <textarea placeholder="Benefícios (um por linha)" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className={`${inputCls} min-h-20`} />
            <textarea placeholder="O que está incluso" value={form.included} onChange={(e) => setForm({ ...form, included: e.target.value })} className={`${inputCls} min-h-16`} />
            <textarea placeholder="Para quem é" value={form.for_whom} onChange={(e) => setForm({ ...form, for_whom: e.target.value })} className={`${inputCls} min-h-16`} />
            <input placeholder="Prazo de entrega (dias)" type="number" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} className={inputCls} />
            <div className="flex gap-2">
              <button type="button" onClick={reset} className="flex-1 glass rounded-xl py-3 text-xs font-bold">CANCELAR</button>
              <button className={`${btnPrimary} flex-1`}>{editing ? "SALVAR" : "PUBLICAR"}</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-2">
        {list.map((o) => (
          <Card key={o.id} className="p-3 space-y-3">
            <div className="flex items-center gap-3">
              {o.cover_url ? (
                <img src={o.cover_url} alt="" className="size-14 rounded-xl object-cover border border-white/10" />
              ) : (
                <div className="size-14 rounded-xl bg-primary/15 border border-primary/25" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{o.title}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded ${o.status === "ativo" ? "bg-success/20 text-success" : "bg-muted/40 text-muted-foreground"}`}>{o.status}</span>
                  <span>R$ {(o.price_cents / 100).toFixed(2)}</span>
                  <span className="inline-flex items-center gap-0.5"><Eye className="size-2.5" />{o.wa_clicks ?? 0}</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Link
                to="/loja/$id"
                params={{ id: o.id }}
                className="h-9 rounded-lg glass text-[10px] font-bold flex items-center justify-center gap-1"
              >
                <Eye className="size-3.5" /> VER
              </Link>
              <button onClick={() => edit(o)} className="h-9 rounded-lg glass text-[10px] font-bold flex items-center justify-center gap-1">
                <Edit3 className="size-3.5" /> EDITAR
              </button>
              <button onClick={() => toggle(o)} className="h-9 rounded-lg glass text-[10px] font-bold flex items-center justify-center gap-1">
                {o.status === "ativo" ? <><Pause className="size-3.5" /> PAUSAR</> : <><Play className="size-3.5" /> ATIVAR</>}
              </button>
              <button onClick={() => remove(o.id)} className="h-9 rounded-lg glass text-[10px] font-bold text-destructive flex items-center justify-center gap-1">
                <Trash2 className="size-3.5" /> EXCLUIR
              </button>
            </div>
          </Card>
        ))}
        {list.length === 0 && (
          <EmptyState icon={Store} title="Sem ofertas ainda" hint="Clique em NOVA OFERTA para publicar a primeira." />
        )}
      </div>
    </AppShell>
  );
}
