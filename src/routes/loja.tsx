import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/AppShell";
import { PageHero, EmptyState } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { Store, Tag, Dumbbell, Search } from "lucide-react";

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
  const [q, setQ] = useState("");
  const [type, setType] = useState<string | null>(null);

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

  const types = Array.from(new Set(list.map((o) => o.offer_type))).filter(Boolean);
  const filtered = list.filter(
    (o) =>
      (!type || o.offer_type === type) &&
      (!q || o.title.toLowerCase().includes(q.toLowerCase()))
  );
  const minPrice = list.length ? Math.min(...list.map((o) => o.price_cents)) / 100 : 0;

  return (
    <AppShell title="Loja" subtitle="Vitrine de ofertas">
      <PageHero
        eyebrow="Marketplace"
        title="Loja VRUMFIT"
        subtitle="Vitrine de ofertas. Negociação direto com o vendedor via WhatsApp."
        icon={Store}
        stats={[
          { label: "Ofertas", value: list.length },
          { label: "Categorias", value: types.length },
          { label: "A partir de", value: list.length ? `R$${minPrice.toFixed(0)}` : "—" },
        ]}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-white/55" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar oferta..."
          className="w-full h-12 rounded-2xl bg-black/60 border border-white/10 pl-12 pr-4 text-[13px] outline-none placeholder:text-white/45 focus:border-primary/60 transition"
        />
      </div>

      {types.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          <button
            onClick={() => setType(null)}
            className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition ${!type ? "bg-primary/15 border border-primary text-primary" : "bg-transparent border border-white/12 text-white/75"}`}
          >
            Todas
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`shrink-0 h-9 px-3.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition ${type === t ? "bg-primary/15 border border-primary text-primary" : "bg-transparent border border-white/12 text-white/75"}`}
            >
              {OFFER_LABEL[t] ?? t}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to="/loja/$id"
            params={{ id: p.id }}
            className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/50 transition text-left aspect-[3/4]"
          >
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top,theme(colors.primary/30),black)]">
                <Dumbbell className="size-10 text-primary/70" />
              </div>
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
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Store}
          title={list.length === 0 ? "Nenhuma oferta publicada" : "Nada encontrado"}
          hint={list.length === 0 ? "Volte em breve para conferir novidades." : "Tente outra busca ou categoria."}
        />
      )}

      <Card className="p-3 flex items-center gap-3">
        <div className="size-10 rounded-xl bg-primary/15 border border-primary/25 grid place-items-center">
          <Store className="size-5 text-primary" />
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">
          Vitrine apenas. Pagamento e entrega são entre comprador e vendedor — via WhatsApp.
        </p>
      </Card>
    </AppShell>
  );
}
