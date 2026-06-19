import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Plus, Trash2, Search } from "lucide-react";

type Person = { id: string; name: string; email: string; phone: string; plan: string; active: boolean };

export const Route = createFileRoute("/alunos")({
  head: () => ({ meta: [{ title: "Alunos — VRUMFIT" }] }),
  component: AlunosPage,
});

const seed: Person[] = [
  { id: "1", name: "Marina Souza", email: "marina@email.com", phone: "11 9 8888-1234", plan: "Premium", active: true },
  { id: "2", name: "Lucas Pereira", email: "lucas@email.com", phone: "11 9 7777-5678", plan: "Standard", active: true },
  { id: "3", name: "Júlia Costa", email: "julia@email.com", phone: "11 9 6666-9012", plan: "Premium", active: true },
  { id: "4", name: "Pedro Lima", email: "pedro@email.com", phone: "11 9 5555-3456", plan: "Basic", active: false },
];

function AlunosPage() {
  const [list, setList] = useLocalState<Person[]>("vrumfit:alunos", seed);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", plan: "Standard" });
  const [show, setShow] = useState(false);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setList([{ id: crypto.randomUUID(), ...form, active: true }, ...list]);
    setForm({ name: "", email: "", phone: "", plan: "Standard" });
    setShow(false);
  };

  const filtered = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell
      title="Alunos"
      subtitle={`${list.length} no total · ${list.filter(l => l.active).length} ativos`}
      action={
        <button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Plus className="size-4" />
        </button>
      }
    >
      {show && (
        <Card>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className={inputCls}>
              <option>Basic</option><option>Standard</option><option>Premium</option>
            </select>
            <button className={btnPrimary}>SALVAR ALUNO</button>
          </form>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar aluno…"
          className="w-full glass rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      <ul className="space-y-2">
        {filtered.map((p) => (
          <li key={p.id} className="glass rounded-2xl p-3 flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-primary font-bold">
              {p.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{p.email} · {p.plan}</p>
            </div>
            <span className={`size-2 rounded-full ${p.active ? "bg-success" : "bg-muted-foreground"}`} />
            <button onClick={() => setList(list.filter((x) => x.id !== p.id))} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <Link to="/treinos" className="block text-center text-[11px] text-primary mt-4">Prescrever treino →</Link>
    </AppShell>
  );
}
