import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, inputCls, btnPrimary } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { Plus, Trash2, Package as Box } from "lucide-react";

type P = { id: string; name: string; price: number; stock: number };

export const Route = createFileRoute("/produtos")({
  head: () => ({ meta: [{ title: "Produtos — VRUMFIT" }] }),
  component: Prod,
});

const seed: P[] = [
  { id: "1", name: "Whey Protein 900g", price: 180, stock: 24 },
  { id: "2", name: "Creatina 300g", price: 110, stock: 18 },
  { id: "3", name: "Camiseta VRUMFIT", price: 89, stock: 40 },
  { id: "4", name: "Garrafa térmica 1L", price: 65, stock: 12 },
];

function Prod() {
  const [list, setList] = useLocalState<P[]>("vrumfit:produtos", seed);
  const [form, setForm] = useState({ name: "", price: "", stock: "" });
  const [show, setShow] = useState(false);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    setList([{ id: crypto.randomUUID(), name: form.name, price: +form.price, stock: +form.stock }, ...list]);
    setForm({ name: "", price: "", stock: "" });
    setShow(false);
  };

  return (
    <AppShell title="Produtos" subtitle={`${list.length} no catálogo`}
      action={<button onClick={() => setShow(!show)} className="size-10 rounded-full bg-primary text-primary-foreground grid place-items-center"><Plus className="size-4" /></button>}>
      {show && (
        <Card>
          <form onSubmit={add} className="space-y-2">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            <input placeholder="Preço" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputCls} />
            <input placeholder="Estoque" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputCls} />
            <button className={btnPrimary}>ADICIONAR</button>
          </form>
        </Card>
      )}
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-3 relative">
            <div className="size-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center mb-2">
              <Box className="size-4 text-primary" />
            </div>
            <p className="text-sm font-semibold leading-tight">{p.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Estoque: {p.stock}</p>
            <p className="text-base font-extrabold text-primary mt-1.5">R$ {p.price}</p>
            <button onClick={() => setList(list.filter((x) => x.id !== p.id))}
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
