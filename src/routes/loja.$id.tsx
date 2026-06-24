import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card, btnPrimary } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BookOpen, Dumbbell, MessageCircle } from "lucide-react";

type Module = { t: string; d?: string };
type Offer = {
  id: string;
  title: string;
  price_cents: number;
  cover_url: string | null;
  short_desc: string | null;
  long_desc: string | null;
  benefits: string[] | null;
  for_whom: string | null;
  included: string | null;
  delivery_days: number | null;
  whatsapp: string | null;
  offer_type: string;
  seller_id: string | null;
  preview: string | null;
  content: string | null;
  modules: Module[] | null;
};

type Seller = { display_name: string | null; logo_url: string | null; specialty: string | null };

export const Route = createFileRoute("/loja/$id")({
  head: () => ({ meta: [{ title: "Oferta — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Detail />
    </RequireAuth>
  ),
});

function Detail() {
  const { id } = Route.useParams();
  const [o, setO] = useState<Offer | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("products")
        .select("id,title,price_cents,cover_url,short_desc,long_desc,benefits,for_whom,included,delivery_days,whatsapp,offer_type,seller_id,preview,content,modules")
        .eq("id", id)
        .maybeSingle();
      setO((data ?? null) as Offer | null);
      setO((data ?? null) as Offer | null);
      if (data?.seller_id) {
        const { data: s } = await supabase
          .from("store_settings")
          .select("display_name,logo_url,specialty")
          .eq("user_id", data.seller_id)
          .maybeSingle();
        setSeller((s ?? null) as Seller | null);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <AppShell title="Oferta">{null}</AppShell>;
  if (!o)
    return (
      <AppShell title="Oferta">
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Oferta não encontrada.</p>
          <Link to="/loja" className="mt-3 inline-flex items-center gap-1 text-primary text-xs"><ArrowLeft className="size-3" /> Voltar</Link>
        </Card>
      </AppShell>
    );

  const waNumber = o.whatsapp?.replace(/\D/g, "") ?? "";
  const waText = encodeURIComponent(`Olá! Tenho interesse na oferta "${o.title}" do VRUMFIT.`);
  const waHref = waNumber ? `whatsapp://send?phone=${waNumber}&text=${waText}` : undefined;

  return (
    <AppShell title={o.title} subtitle={seller?.display_name ?? "Vendedor"}>
      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
        {o.cover_url ? (
          <img src={o.cover_url} alt={o.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_top,theme(colors.primary/30),black)]">
            <Dumbbell className="size-12 text-primary/70" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-[9px] font-bold uppercase tracking-wider">{o.offer_type}</div>
      </div>

      <Card className="p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">{o.offer_type}</p>
        <h1 className="text-xl font-extrabold leading-tight">{o.title}</h1>
        <p className="text-2xl font-extrabold text-primary mt-1">R$ {(o.price_cents / 100).toFixed(2)}</p>
        {o.delivery_days != null && (
          <p className="text-[11px] text-muted-foreground">Entrega em até {o.delivery_days} dia(s)</p>
        )}
      </Card>

      {seller && (
        <Card className="p-3 flex items-center gap-3">
          {seller.logo_url ? (
            <img src={seller.logo_url} alt="" className="size-10 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="size-10 rounded-full bg-primary/15 border border-primary/25" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{seller.display_name ?? "Vendedor"}</p>
            {seller.specialty && <p className="text-[11px] text-muted-foreground truncate">{seller.specialty}</p>}
          </div>
        </Card>
      )}

      {o.short_desc && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">Resumo</p>
          <p className="text-sm">{o.short_desc}</p>
        </Card>
      )}

      {o.long_desc && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">Descrição</p>
          <p className="text-sm whitespace-pre-wrap">{o.long_desc}</p>
        </Card>
      )}

      {o.benefits && o.benefits.length > 0 && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Benefícios</p>
          <ul className="space-y-1">
            {o.benefits.map((b, i) => (
              <li key={i} className="text-sm flex gap-2"><span className="text-primary">•</span>{b}</li>
            ))}
          </ul>
        </Card>
      )}

      {o.included && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">O que está incluso</p>
          <p className="text-sm whitespace-pre-wrap">{o.included}</p>
        </Card>
      )}

      {o.for_whom && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1">Para quem é</p>
          <p className="text-sm whitespace-pre-wrap">{o.for_whom}</p>
        </Card>
      )}

      {o.modules && o.modules.length > 0 && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2 flex items-center gap-1"><BookOpen className="size-3" /> Módulos</p>
          <ol className="space-y-1.5">
            {o.modules.map((m, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="size-6 shrink-0 rounded-full bg-primary/15 border border-primary/30 grid place-items-center text-[10px] font-bold text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{m.t}</p>
                  {m.d && <p className="text-[11px] text-muted-foreground">{m.d}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {o.preview && (
        <Card className="p-4 border-primary/30">
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary mb-1">Prévia gratuita</p>
          <p className="text-sm whitespace-pre-wrap">{o.preview}</p>
        </Card>
      )}

      {o.content && (
        <Card className="p-4">
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Conteúdo completo</p>
          <article className="text-sm whitespace-pre-wrap leading-relaxed prose-invert">{o.content}</article>
        </Card>
      )}

      <p className="text-[10px] text-center text-white/40 px-4 pb-2">
        VRUMFIT é vitrine. Pagamento e entrega são tratados diretamente com o vendedor.
      </p>

      <div className="h-16" />

      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <div className="max-w-md mx-auto">
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} w-full flex items-center justify-center gap-2 shadow-2xl`}>
              <MessageCircle className="size-4" /> CHAMAR NO WHATSAPP
            </a>
          ) : (
            <button disabled className={`${btnPrimary} w-full flex items-center justify-center gap-2 shadow-2xl opacity-60`}>
              <MessageCircle className="size-4" /> SEM WHATSAPP
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
