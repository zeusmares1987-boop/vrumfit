import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Check, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Plan = { id: string; name: string; price_cents: number; period: string; benefits: string[] | null; status: string };

export const Route = createFileRoute("/planos")({
  head: () => ({ meta: [{ title: "Planos — VRUMFIT" }] }),
  component: Planos,
});

function Planos() {
  const { role } = useAuth();
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
    const { error } = await supabase.from("plans").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono";

  return (
    <AppShell title="Planos" subtitle="Assinaturas oferecidas"
      action={canEdit ? (
        <button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Plus className="size-4" />
        </button>
      ) : undefined}>
      {show && (
        <Card className="p-3">
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

      <div className="space-y-3">
        {list.map((p) => (
          <Card key={p.id} className="p-3 relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">{p.name}</p>
                <p className="text-2xl font-extrabold mt-1">
                  R$ {(p.price_cents / 100).toFixed(2)}
                  <span className="text-xs text-muted-foreground font-medium">/{p.period}</span>
                </p>
              </div>
              {canEdit && (
                <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
            <ul className="space-y-1.5">
              {(p.benefits ?? []).map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs">
                  <Check className="size-3.5 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {list.length === 0 && <p className="text-center text-xs text-white/50 py-6">Nenhum plano cadastrado.</p>}
      </div>
    </AppShell>
  );
}
