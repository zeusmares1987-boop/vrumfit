import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Plus, Trash2 } from "lucide-react";

type P = { id: string; name: string; cref: string; specialty: string; students: number };

export const Route = createFileRoute("/personais")({
  head: () => ({ meta: [{ title: "Personais — VRUMFIT" }] }),
  component: Personais,
});

const seed: P[] = [
  { id: "1", name: "Carlos Personal", cref: "012345-G/SP", specialty: "Hipertrofia", students: 24 },
  { id: "2", name: "Ana Trainer", cref: "098765-G/SP", specialty: "Emagrecimento", students: 18 },
  { id: "3", name: "Bruno Coach", cref: "054321-G/SP", specialty: "Funcional", students: 31 },
];

function Personais() {
  const [list, setList] = useLocalState<P[]>("vrumfit:personais", seed);
  const [form, setForm] = useState({ name: "", cref: "", specialty: "" });
  const [show, setShow] = useState(false);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setList([{ id: crypto.randomUUID(), ...form, students: 0 }, ...list]);
    setForm({ name: "", cref: "", specialty: "" });
    setShow(false);
  };

  return (
    <AppShell
      title="Personais"
      subtitle={`${list.length} no time · ${list.reduce((s, p) => s + p.students, 0)} alunos`}
      action={<button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="size-4" /></button>}
    >
      {show && (
        <Card>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="CREF" value={form.cref} onChange={(e) => setForm({ ...form, cref: e.target.value })} className={inputCls} />
            <input placeholder="Especialidade" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>SALVAR</button>
          </form>
        </Card>
      )}
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold">{p.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{p.cref} · {p.specialty}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary">{p.students}</p>
              <p className="text-[9px] uppercase text-muted-foreground">alunos</p>
            </div>
            <button onClick={() => setList(list.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
