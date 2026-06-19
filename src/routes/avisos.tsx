import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Megaphone, Plus, Trash2 } from "lucide-react";

type N = { id: string; title: string; body: string; date: string };

export const Route = createFileRoute("/avisos")({
  head: () => ({ meta: [{ title: "Avisos — VRUMFIT" }] }),
  component: Avisos,
});

const seed: N[] = [
  { id: "1", title: "Feriado dia 20", body: "Não haverá atendimento. Treinos remarcados.", date: "12/06" },
  { id: "2", title: "Nova turma de funcional", body: "Terças e quintas, 19h. Vagas limitadas.", date: "08/06" },
];

function Avisos() {
  const [list, setList] = useLocalState<N[]>("vrumfit:avisos", seed);
  const [form, setForm] = useState({ title: "", body: "" });
  const [show, setShow] = useState(false);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) return;
    const d = new Date();
    setList([{ id: crypto.randomUUID(), ...form,
      date: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}` }, ...list]);
    setForm({ title: "", body: "" });
    setShow(false);
  };

  return (
    <AppShell title="Avisos" subtitle="Comunicados internos"
      action={<button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="size-4" /></button>}>
      {show && (
        <Card>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            <textarea placeholder="Mensagem" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={`${inputCls} min-h-[80px]`} />
            <button className={btnPrimary}>PUBLICAR</button>
          </form>
        </Card>
      )}
      <div className="space-y-2">
        {list.map((n) => (
          <div key={n.id} className="glass rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" />
                <p className="text-sm font-bold">{n.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{n.date}</span>
                <button onClick={() => setList(list.filter((x) => x.id !== n.id))} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{n.body}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
