import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createMpCheckout } from "@/lib/mp.functions";
import { Check, Plus, Trash2, X, CreditCard, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Plan = { id: string; name: string; price_cents: number; period: string; benefits: string[] | null; status: string; role_target: string | null };

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Planos />
    </RequireAuth>
  ),
});

function Planos() {
  const { role } = useAuth();
  const checkout = useServerFn(createMpCheckout);
  const [paying, setPaying] = useState<string | null>(null);
  const subscribe = async (planId: string) => {
    setPaying(planId);
    try {
      const r = await checkout({ data: { planId } });
      window.location.href = r.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no pagamento";
      toast.error(msg === "PAYMENT_UNAVAILABLE" ? "Pagamento indisponível no momento" : msg);
      setPaying(null);
    }
  };
  const [list, setList] = useState<Plan[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", period: "mensal", benefits: "" });

  const load = async () => {
    const { data, error } = await supabase.from("plans").select("*").order("price_cents");
    if (error) toast.error(error.message); else setList((data ?? []) as Plan[]);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    const { error } = await supabase.from("plans").insert({
      name: form.name, period: form.period,
      price_cents: Math.round(parseFloat(form.price) * 100),
      benefits: form.benefits.split("\n").map((s) => s.trim()).filter(Boolean),
      status: "ativo" as any,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", price: "", period: "mensal", benefits: "" });
    setShow(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover plano?")) return;
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono";
  const visible = canEdit
    ? list
    : list.filter((p) => {
        const t = p.role_target;
        if (!t || t === "todos") return true;
        if (role === "personal") return t === "professor" || t === "personal";
        if (role === "aluno") return t === "aluno";
        return false;
      });
  const cheapest = visible.length ? Math.min(...visible.map((p) => p.price_cents)) : 0;

  return (
    <AppShell title="Planos">
      <PageHero
        eyebrow="Assinaturas"
        title="Planos"
        subtitle="Ofertas e benefícios da sua academia"
        icon={CreditCard}
        stats={[
          { label: "Planos", value: visible.length },
          { label: "A partir de", value: cheapest ? `R$ ${(cheapest / 100).toFixed(0)}` : "—" },
          { label: "Ativos", value: visible.filter((p) => p.status === "ativo").length },
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
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">Novo plano</p>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome do plano" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Preço (R$)" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={inputCls}>
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
            </select>
            <textarea placeholder="Benefícios (um por linha)" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className={`${inputCls} min-h-[100px] py-2`} />
            <button className={btnPrimary}>SALVAR</button>
          </form>
        </Card>
      )}

      {list.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sem planos cadastrados"
          hint={canEdit ? "Toque no + para criar o primeiro plano." : "Aguarde o gestor configurar planos."}
        />
      ) : (
        <div className="space-y-3">
          {list.map((p, idx) => {
            const featured = idx === 1 && list.length >= 2;
            return (
              <Card key={p.id} className={`p-4 relative overflow-hidden ${featured ? "border-primary/60 bg-gradient-to-br from-primary/10 to-transparent" : ""}`}>
                {featured && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-2xl flex items-center gap-1">
                    <Sparkles className="size-2.5" /> Mais escolhido
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{p.name}</p>
                    <p className="text-3xl font-extrabold mt-1 leading-none">
                      R$ {(p.price_cents / 100).toFixed(2)}
                      <span className="text-xs text-muted-foreground font-medium ml-1">/{p.period}</span>
                    </p>
                  </div>
                  {canEdit && (
                    <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive p-1.5">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {(p.benefits ?? []).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-primary/20">
                        <Check className="size-2.5 text-primary" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
                {!canEdit && p.status === "ativo" && p.price_cents > 0 && (
                  <button
                    onClick={() => subscribe(p.id)}
                    disabled={paying === p.id}
                    className={`${btnPrimary} mt-4 disabled:opacity-60`}
                  >
                    {paying === p.id ? "ABRINDO PAGAMENTO…" : "ASSINAR COM PIX OU CARTÃO"}
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
