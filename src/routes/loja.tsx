import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/AppShell";
import { useLocalState } from "@/hooks/use-local-state";
import { ShoppingCart, Trash2 } from "lucide-react";

type P = { id: string; name: string; price: number };
type Cart = { id: string; qty: number }[];

export const Route = createFileRoute("/loja")({
  head: () => ({ meta: [{ title: "Loja — VRUMFIT" }] }),
  component: Loja,
});

function Loja() {
  const [prods] = useLocalState<P[]>("vrumfit:produtos", [
    { id: "1", name: "Whey Protein 900g", price: 180 },
    { id: "2", name: "Creatina 300g", price: 110 },
    { id: "3", name: "Camiseta VRUMFIT", price: 89 },
    { id: "4", name: "Garrafa térmica 1L", price: 65 },
  ]);
  const [cart, setCart] = useLocalState<Cart>("vrumfit:cart", []);

  const add = (id: string) => {
    const ex = cart.find((c) => c.id === id);
    setCart(ex ? cart.map((c) => c.id === id ? { ...c, qty: c.qty + 1 } : c) : [...cart, { id, qty: 1 }]);
  };
  const rm = (id: string) => setCart(cart.filter((c) => c.id !== id));

  const total = cart.reduce((s, c) => s + (prods.find((p) => p.id === c.id)?.price ?? 0) * c.qty, 0);

  return (
    <AppShell title="Loja" subtitle="Vendas internas">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Carrinho</p>
            <p className="text-xl font-extrabold mt-1">R$ {total}</p>
          </div>
          <ShoppingCart className="size-6 text-primary" />
        </div>
        {cart.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {cart.map((c) => {
              const p = prods.find((x) => x.id === c.id);
              if (!p) return null;
              return (
                <li key={c.id} className="flex items-center justify-between text-xs glass rounded-lg px-3 py-2">
                  <span>{p.name} × {c.qty}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">R$ {p.price * c.qty}</span>
                    <button onClick={() => rm(c.id)}><Trash2 className="size-3 text-muted-foreground" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {prods.map((p) => (
          <button key={p.id} onClick={() => add(p.id)} className="glass rounded-2xl p-3 text-left hover:border-primary/40">
            <p className="text-sm font-semibold leading-tight">{p.name}</p>
            <p className="text-base font-extrabold text-primary mt-2">R$ {p.price}</p>
            <p className="text-[10px] uppercase text-muted-foreground mt-1">Toque para adicionar</p>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
