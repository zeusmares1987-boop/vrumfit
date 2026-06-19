import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Store, Tag, Dumbbell } from "lucide-react";

type Offer = {
  id: string;
  title: string;
  price_cents: number;
  cover_url: string | null;
  short_desc: string | null;
  category: string | null;
  offer_type: string;
  seller_id: string | null;
};

const OFFER_LABEL: Record<string, string> = {
  digital: "Digital",
  treino: "Treino",
  dieta: "Dieta",
  treino_dieta: "Treino + Dieta",
  consultoria: "Consultoria",
  avaliacao: "Avaliação",
  acompanhamento: "Acompanhamento",
  presencial: "Presencial",
};

export const Route = createFileRoute("/loja")({
  head: () => ({ meta: [{ title: "Loja — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Loja />
    </RequireAuth>
  ),
});

function Loja() {
  const [list, setList] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price_cents,cover_url,short_desc,category,offer_type,seller_id")
        .eq("status", "ativo")
        .order("created_at", { ascending: false });
      setList((data ?? []) as Offer[]);
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell title="Loja" subtitle="Vitrine de ofertas">
      <Card className="p-3 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center">
          <Store className="size-5 text-primary" />
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Vitrine apenas. Negociação, pagamento e entrega são entre comprador e vendedor — via WhatsApp.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <Link
            key={p.id}
            to="/loja/$id"
            params={{ id: p.id }}
            className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition text-left aspect-[3/4]"
          >
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            <div className="relative h-full p-3 flex flex-col justify-end">
              <p className="text-[9px] uppercase tracking-[0.2em] text-primary/90 font-bold mb-1 flex items-center gap-1">
                <Tag className="size-2.5" /> {OFFER_LABEL[p.offer_type] ?? p.category ?? "Oferta"}
              </p>
              <p className="text-[13px] font-extrabold leading-tight line-clamp-2">{p.title}</p>
              {p.short_desc && <p className="text-[10px] text-white/65 line-clamp-2 mt-0.5">{p.short_desc}</p>}
              <p className="text-base font-extrabold text-primary mt-1.5">R$ {(p.price_cents / 100).toFixed(2)}</p>
            </div>
          </Link>
        ))}
        {!loading && list.length === 0 && (
          <p className="col-span-2 text-center text-xs text-white/50 py-6">Nenhuma oferta publicada.</p>
        )}
      </div>
    </AppShell>
  );
}
