import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Invoice = {
  id: string;
  student_id: string;
  plan_id: string | null;
  amount_cents: number;
  due_date: string;
  status: string;
  paid_at: string | null;
  profiles?: { full_name: string | null } | null;
  plans?: { name: string } | null;
};
type Student = { user_id: string; profiles: { full_name: string | null } | null };
type Plan = { id: string; name: string; price_cents: number };
type ProfileName = { id: string; full_name: string | null };

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Fin />
    </RequireAuth>
  ),
});

function Fin() {
  const { role } = useAuth();
  const [list, setList] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ student_id: "", plan_id: "", amount: "", due_date: "" });
  const [show, setShow] = useState(false);

  const load = async () => {
    try {
      const [invRes, stRes, plRes] = await Promise.all([
        supabase.from("invoices").select("*").order("due_date", { ascending: false }),
        supabase.from("students").select("user_id"),
        supabase.from("plans").select("id,name,price_cents").eq("status", "ativo"),
      ]);
      if (invRes.error) throw invRes.error;
      if (stRes.error) throw stRes.error;
      if (plRes.error) throw plRes.error;

      const invoices = (invRes.data ?? []) as Omit<Invoice, "profiles" | "plans">[];
      const studentRows = (stRes.data ?? []) as { user_id: string }[];
      const plansRows = (plRes.data ?? []) as Plan[];
      const profileIds = Array.from(new Set([...studentRows.map((s) => s.user_id), ...invoices.map((i) => i.student_id)]));
      const { data: profs, error: profError } = profileIds.length
        ? await supabase.from("profiles").select("id,full_name").in("id", profileIds)
        : { data: [], error: null };
      if (profError) throw profError;

      const profilesById = new Map((profs as ProfileName[] | null ?? []).map((p) => [p.id, p]));
      const plansById = new Map(plansRows.map((p) => [p.id, p]));
      setList(invoices.map((i) => ({
        ...i,
        profiles: profilesById.get(i.student_id) ?? null,
        plans: i.plan_id ? { name: plansById.get(i.plan_id)?.name ?? "" } : null,
      })) as Invoice[]);
      setStudents(studentRows.map((s) => ({ user_id: s.user_id, profiles: profilesById.get(s.user_id) ?? null })));
      setPlans(plansRows);
    } catch (error: any) {
      toast.error(error.message ?? "Falha ao carregar financeiro.");
      setList([]);
      setStudents([]);
      setPlans([]);
    }
  };
  useEffect(() => { load(); }, []);

  const paidSum = list.filter((i) => i.status === "pago").reduce((s, i) => s + i.amount_cents, 0);
  const pendSum = list.filter((i) => i.status !== "pago").reduce((s, i) => s + i.amount_cents, 0);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.due_date) return;
    const { error } = await supabase.from("invoices").insert({
      student_id: form.student_id,
      plan_id: form.plan_id || null,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      due_date: form.due_date,
      status: "pendente" as any,
    });
    if (error) return toast.error(error.message);
    setForm({ student_id: "", plan_id: "", amount: "", due_date: "" });
    setShow(false);
    load();
  };

  const togglePaid = async (i: Invoice) => {
    const isPaid = i.status === "pago";
    const { error } = await supabase.from("invoices").update({
      status: (isPaid ? "pendente" : "pago") as any,
      paid_at: isPaid ? null : new Date().toISOString(),
    }).eq("id", i.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono";

  return (
    <AppShell title="Financeiro" subtitle="Faturas e recebimentos"
      action={canEdit ? (
        <button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Plus className="size-4" />
        </button>
      ) : undefined}>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Recebido" value={`R$ ${(paidSum / 100).toFixed(0)}`} icon={TrendingUp} color="text-success" />
        <Stat label="A receber" value={`R$ ${(pendSum / 100).toFixed(0)}`} icon={TrendingDown} color="text-destructive" />
        <Stat label="Total" value={`R$ ${((paidSum + pendSum) / 100).toFixed(0)}`} icon={TrendingUp} color="text-primary" />
      </div>

      {show && (
        <Card className="p-3">
          <form onSubmit={add} className="space-y-2">
            <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className={inputCls}>
              <option value="">Aluno…</option>
              {students.map((s) => (
                <option key={s.user_id} value={s.user_id}>{s.profiles?.full_name ?? s.user_id}</option>
              ))}
            </select>
            <select value={form.plan_id} onChange={(e) => {
              const p = plans.find((x) => x.id === e.target.value);
              setForm({ ...form, plan_id: e.target.value, amount: p ? (p.price_cents / 100).toString() : form.amount });
            }} className={inputCls}>
              <option value="">Plano (opcional)…</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — R$ {(p.price_cents / 100).toFixed(2)}</option>)}
            </select>
            <input placeholder="Valor (R$)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
            <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>REGISTRAR FATURA</button>
          </form>
        </Card>
      )}

      <ul className="space-y-2">
        {list.map((i) => (
          <li key={i.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <button onClick={() => canEdit && togglePaid(i)}
              className={`size-8 rounded-lg grid place-items-center ${i.status === "pago" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {i.status === "pago" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {i.profiles?.full_name ?? "—"} {i.plans?.name && <span className="text-white/40">· {i.plans.name}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Venc.: {new Date(i.due_date).toLocaleDateString("pt-BR")} · {i.status}
              </p>
            </div>
            <p className={`text-sm font-bold ${i.status === "pago" ? "text-success" : "text-destructive"}`}>
              R$ {(i.amount_cents / 100).toFixed(2)}
            </p>
            {canEdit && (
              <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </li>
        ))}
        {list.length === 0 && <p className="text-center text-xs text-white/50 py-6">Sem faturas.</p>}
      </ul>
    </AppShell>
  );
}

function Stat({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <Icon className={`size-4 ${color}`} />
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1.5">{label}</p>
      <p className={`text-sm font-extrabold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
