import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Plus, TrendingUp, TrendingDown, Trash2, X, Wallet, CheckCircle2, AlertCircle } from "lucide-react";
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
    <RequireAuth allow={["dono", "personal", "aluno"]}>
      <Fin />
    </RequireAuth>
  ),
});

function Fin() {
  const { user, role } = useAuth();
  const [list, setList] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({ student_id: "", plan_id: "", amount: "", due_date: "" });
  const [show, setShow] = useState(false);
  const [filter, setFilter] = useState<"todos" | "pago" | "pendente">("todos");

  const load = async () => {
    if (!user) return;
    try {
      const studentsQuery = role === "aluno" && user
        ? Promise.resolve({ data: [{ user_id: user.id }], error: null } as any)
        : role === "personal"
        ? supabase.from("students").select("user_id").eq("personal_id", user.id)
        : supabase.from("students").select("user_id");
      const stRes = await studentsQuery;
      if (stRes.error) throw stRes.error;
      const studentRows = (stRes.data ?? []) as { user_id: string }[];
      const myStudentIds = studentRows.map((s) => s.user_id);

      const invoicesQuery = role === "aluno"
        ? supabase.from("invoices").select("*").eq("student_id", user.id).order("due_date", { ascending: false })
        : role === "personal"
        ? (myStudentIds.length
            ? supabase.from("invoices").select("*").in("student_id", myStudentIds).order("due_date", { ascending: false })
            : Promise.resolve({ data: [], error: null } as any))
        : supabase.from("invoices").select("*").order("due_date", { ascending: false });
      const [invRes, plRes] = await Promise.all([
        invoicesQuery,
        supabase.from("plans").select("id,name,price_cents").eq("status", "ativo"),
      ]);
      if (invRes.error) throw invRes.error;
      if (plRes.error) throw plRes.error;

      const invoices = (invRes.data ?? []) as Omit<Invoice, "profiles" | "plans">[];
      const plansRows = (plRes.data ?? []) as Plan[];
      const profileIds = Array.from(new Set([...studentRows.map((s) => s.user_id), ...invoices.map((i) => i.student_id)]));
      const { data: profs, error: profError } = profileIds.length
        ? await supabase.from("profiles").select("id,full_name").in("id", profileIds)
        : { data: [], error: null };
      if (profError) throw profError;

      const profileRows = (profs ?? []) as ProfileName[];
      const profilesById = new Map(profileRows.map((p) => [p.id, p]));
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
      setList([]); setStudents([]); setPlans([]);
    }
  };
  useEffect(() => { load(); }, [user?.id, role]);

  const paidSum = list.filter((i) => i.status === "pago").reduce((s, i) => s + i.amount_cents, 0);
  const pendSum = list.filter((i) => i.status !== "pago").reduce((s, i) => s + i.amount_cents, 0);
  const brl = (c: number) => `R$ ${(c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.amount || !form.due_date) return;
    const { error } = await supabase.from("invoices").insert({
      student_id: form.student_id,
      plan_id: form.plan_id || null,
      amount_cents: Math.round(parseFloat(form.amount) * 100),
      due_date: form.due_date,
      status: "pendente" as any,
      personal_id: role === "personal" ? user?.id : undefined,
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
    if (!confirm("Remover fatura?")) return;
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList(list.filter((x) => x.id !== id));
  };

  const canEdit = role === "dono" || role === "personal";
  const filtered = list.filter((i) => filter === "todos" || i.status === filter);

  return (
    <AppShell title="Financeiro">
      <PageHero
        eyebrow="Caixa"
        title="Financeiro"
        subtitle={role === "aluno" ? "Suas cobranças e pagamentos" : "Faturas, recebimentos e pendências"}
        icon={Wallet}
        stats={[
          { label: "Recebido", value: brl(paidSum) },
          { label: "A receber", value: brl(pendSum) },
          { label: "Total", value: brl(paidSum + pendSum) },
        ]}
        action={canEdit ? (
          <button onClick={() => setShow(!show)} className="size-11 rounded-2xl bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/40 hover:scale-105 transition">
            {show ? <X className="size-5" /> : <Plus className="size-5" />}
          </button>
        ) : undefined}
      />

      {show && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-widest text-primary font-bold mb-3">Nova fatura</p>
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

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {(["todos", "pago", "pendente"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition ${
              filter === f ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}>{f}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Wallet} title="Sem faturas" hint={canEdit ? "Toque no + para registrar a primeira." : undefined} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((i) => {
            const paid = i.status === "pago";
            const Icon = paid ? CheckCircle2 : AlertCircle;
            return (
              <li key={i.id} className="glass rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition">
                <button
                  onClick={() => canEdit && togglePaid(i)}
                  className={`size-11 rounded-2xl grid place-items-center shrink-0 border ${
                    paid ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  <Icon className="size-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{role === "aluno" ? "Minha fatura" : i.profiles?.full_name ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {i.plans?.name && <>{i.plans.name} · </>}
                    Venc.: {new Date(i.due_date).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-extrabold ${paid ? "text-success" : "text-destructive"}`}>
                    R$ {(i.amount_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{i.status}</p>
                </div>
                {canEdit && (
                  <button onClick={() => remove(i.id)} className="text-muted-foreground hover:text-destructive shrink-0 p-1">
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
