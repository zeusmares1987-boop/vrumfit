import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Plus, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

type Tx = { id: string; type: "in" | "out"; desc: string; amount: number; date: string };

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — VRUMFIT" }] }),
  component: Fin,
});

const seed: Tx[] = [
  { id: "1", type: "in", desc: "Mensalidade — Marina", amount: 280, date: "10/06" },
  { id: "2", type: "in", desc: "Mensalidade — Lucas", amount: 220, date: "08/06" },
  { id: "3", type: "out", desc: "Aluguel sala", amount: 1800, date: "05/06" },
  { id: "4", type: "in", desc: "Avaliação avulsa", amount: 150, date: "03/06" },
];

function Fin() {
  const [list, setList] = useLocalState<Tx[]>("vrumfit:fin", seed);
  const [form, setForm] = useState<{ type: "in" | "out"; desc: string; amount: string }>({ type: "in", desc: "", amount: "" });
  const [show, setShow] = useState(false);

  const inSum = list.filter((t) => t.type === "in").reduce((s, t) => s + t.amount, 0);
  const outSum = list.filter((t) => t.type === "out").reduce((s, t) => s + t.amount, 0);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.desc || !form.amount) return;
    const d = new Date();
    setList([{ id: crypto.randomUUID(), type: form.type, desc: form.desc, amount: +form.amount,
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` }, ...list]);
    setForm({ type: "in", desc: "", amount: "" });
    setShow(false);
  };

  return (
    <AppShell title="Financeiro" subtitle="Receita e despesas"
      action={<button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="size-4" /></button>}>
      <div className="grid grid-cols-3 gap-3">
        <Box label="Entradas" value={`R$ ${inSum}`} icon={TrendingUp} color="text-success" />
        <Box label="Saídas" value={`R$ ${outSum}`} icon={TrendingDown} color="text-destructive" />
        <Box label="Saldo" value={`R$ ${inSum - outSum}`} icon={TrendingUp} color="text-primary" />
      </div>

      {show && (
        <Card>
          <form onSubmit={add} className="space-y-2">
            <div className="flex gap-2">
              {(["in", "out"] as const).map((t) => (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold ${form.type === t ? "bg-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {t === "in" ? "Entrada" : "Saída"}
                </button>
              ))}
            </div>
            <input placeholder="Descrição" value={form.desc} onChange={(e) => setForm({ ...form, desc: e.target.value })} className={inputCls} />
            <input placeholder="Valor (R$)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>REGISTRAR</button>
          </form>
        </Card>
      )}

      <ul className="space-y-2">
        {list.map((t) => (
          <li key={t.id} className="glass rounded-xl p-3 flex items-center gap-3">
            <div className={`size-8 rounded-lg grid place-items-center ${t.type === "in" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {t.type === "in" ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{t.desc}</p>
              <p className="text-[10px] text-muted-foreground">{t.date}</p>
            </div>
            <p className={`text-sm font-bold ${t.type === "in" ? "text-success" : "text-destructive"}`}>
              {t.type === "in" ? "+" : "-"}R$ {t.amount}
            </p>
            <button onClick={() => setList(list.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}

function Box({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <Icon className={`size-4 ${color}`} />
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-1.5">{label}</p>
      <p className={`text-sm font-extrabold mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
