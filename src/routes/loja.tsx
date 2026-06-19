import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

type P = { id: string; title: string; price_cents: number; cover_url: string | null; short_desc: string | null; category: string | null };

export const Route = createFileRoute("/loja")({
  head: () => ({ meta: [{ title: "Loja — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Loja />
    </RequireAuth>
  ),
});

function Loja() {
  const { user } = useAuth();
  const [prods, setProds] = useState<P[]>([]);
  const [cart, setCart] = useState<{ id: string; qty: number }[]>([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("products").select("id,title,price_cents,cover_url,short_desc,category").eq("status", "ativo");
      setProds((data ?? []) as P[]);
    })();
  }, []);

  const add = (id: string) => {
    const ex = cart.find((c) => c.id === id);
    setCart(ex ? cart.map((c) => c.id === id ? { ...c, qty: c.qty + 1 } : c) : [...cart, { id, qty: 1 }]);
  };
  const rm = (id: string) => setCart(cart.filter((c) => c.id !== id));

  const total = cart.reduce((s, c) => s + (prods.find((p) => p.id === c.id)?.price_cents ?? 0) * c.qty, 0);

  const checkout = async () => {
    if (!user || cart.length === 0) return;
    setPlacing(true);
    const { data: order, error } = await supabase.from("orders").insert({
      buyer_id: user.id, total_cents: total, status: "pendente" as any,
    }).select("id").single();
    if (error || !order) { setPlacing(false); return toast.error(error?.message ?? "Erro"); }
    const items = cart.map((c) => ({
      order_id: order.id, product_id: c.id, qty: c.qty,
      price_cents: prods.find((p) => p.id === c.id)?.price_cents ?? 0,
    }));
    const { error: e2 } = await supabase.from("order_items").insert(items);
    setPlacing(false);
    if (e2) return toast.error(e2.message);
    toast.success("Pedido criado!");
    setCart([]);
  };

  return (
    <AppShell title="Loja" subtitle="Vendas internas">
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">Carrinho</p>
            <p className="text-xl font-extrabold mt-1">R$ {(total / 100).toFixed(2)}</p>
          </div>
          <ShoppingCart className="size-6 text-primary" />
        </div>
        {cart.length > 0 && (
          <>
            <ul className="mt-3 space-y-1.5">
              {cart.map((c) => {
                const p = prods.find((x) => x.id === c.id);
                if (!p) return null;
                return (
                  <li key={c.id} className="flex items-center justify-between text-xs glass rounded-lg px-3 py-2">
                    <span>{p.title} × {c.qty}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">R$ {((p.price_cents * c.qty) / 100).toFixed(2)}</span>
                      <button onClick={() => rm(c.id)}><Trash2 className="size-3 text-muted-foreground" /></button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <button onClick={checkout} disabled={placing} className={`${btnPrimary} w-full mt-3`}>
              {placing ? "FINALIZANDO…" : "FINALIZAR PEDIDO"}
            </button>
          </>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {prods.map((p) => (
          <button key={p.id} onClick={() => add(p.id)} className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition text-left aspect-[3/4]">
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="relative h-full p-3 flex flex-col justify-end">
              {p.category && <p className="text-[9px] uppercase tracking-[0.2em] text-primary/90 font-bold mb-1">{p.category}</p>}
              <p className="text-[13px] font-extrabold leading-tight">{p.title}</p>
              {p.short_desc && <p className="text-[10px] text-white/65 line-clamp-2 mt-0.5">{p.short_desc}</p>}
              <p className="text-base font-extrabold text-primary mt-1.5">R$ {(p.price_cents / 100).toFixed(2)}</p>
            </div>
          </button>
        ))}
        {prods.length === 0 && <p className="col-span-2 text-center text-xs text-white/50 py-6">Sem produtos disponíveis.</p>}
      </div>
    </AppShell>
  );
}
