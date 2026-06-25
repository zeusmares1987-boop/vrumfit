import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, Card } from "@/components/AppShell";
import { PageHero } from "@/components/PageHero";
import { RequireAuth } from "@/components/RequireAuth";
import { createMpCheckout, processMpPayment } from "@/lib/mp.functions";
import { useAuth } from "@/lib/auth";
import { CreditCard, CheckCircle2, Clock, ArrowLeft, Copy, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout/$planId")({
  head: () => ({ meta: [{ title: "Pagamento — VRUMFIT" }] }),
  component: () => (
    <RequireAuth>
      <Checkout />
    </RequireAuth>
  ),
});

type InitData = { subscriptionId: string; publicKey: string; amount: number; title: string };
type PixData = { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string } | null;

declare global {
  interface Window {
    MercadoPago?: new (key: string, opts?: { locale?: string }) => {
      bricks: () => {
        create: (
          name: string,
          containerId: string,
          settings: Record<string, unknown>,
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

function loadMpSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (window.MercadoPago) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://sdk.mercadopago.com/js/v2"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar SDK")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar SDK"));
    document.head.appendChild(s);
  });
}

function Checkout() {
  const { planId } = useParams({ from: "/checkout/$planId" });
  const nav = useNavigate();
  const { user } = useAuth();
  const init = useServerFn(createMpCheckout);
  const pay = useServerFn(processMpPayment);
  const [data, setData] = useState<InitData | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "processing" | "approved" | "pending" | "rejected">("loading");
  const [tab, setTab] = useState<"card" | "pix">("pix");
  const [pix, setPix] = useState<PixData>(null);
  const [error, setError] = useState<string | null>(null);
  const brickRef = useRef<{ unmount: () => void } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Boot
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await init({ data: { planId } });
        if (!alive) return;
        setData(r);
        await loadMpSdk();
        if (!alive) return;
        setStatus("ready");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao iniciar pagamento";
        setError(msg === "PAYMENT_UNAVAILABLE" ? "Pagamento indisponível no momento." : msg);
        setStatus("rejected");
      }
    })();
    return () => {
      alive = false;
    };
  }, [planId, init]);

  // Mount Bricks (cartão apenas)
  useEffect(() => {
    if (tab !== "card") return;
    if (status !== "ready" || !data || !window.MercadoPago || !containerRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const mp = new window.MercadoPago!(data.publicKey, { locale: "pt-BR" });
        const bricks = mp.bricks();
        if (brickRef.current) {
          brickRef.current.unmount();
          brickRef.current = null;
        }
        const controller = await bricks.create("cardPayment", "vrum-mp-brick", {
          initialization: {
            amount: data.amount,
            payer: { email: user?.email ?? "" },
          },
          customization: {
            paymentMethods: { maxInstallments: 12 },
            visual: { style: { theme: "dark" } },
          },
          callbacks: {
            onReady: () => {},
            onSubmit: async ({ formData }: { formData: Record<string, unknown> }) => {
              setStatus("processing");
              try {
                const r = await pay({
                  data: {
                    subscriptionId: data.subscriptionId,
                    token: formData.token as string | undefined,
                    issuer_id: formData.issuer_id as string | undefined,
                    payment_method_id: formData.payment_method_id as string,
                    installments: formData.installments as number | undefined,
                    payer: formData.payer as { email: string; identification?: { type: string; number: string } },
                  },
                });
                if (r.status === "approved") {
                  setStatus("approved");
                  toast.success("Pagamento aprovado!");
                } else {
                  setStatus("pending");
                  toast.message("Pagamento em análise");
                }
              } catch (e) {
                const msg = e instanceof Error ? e.message : "Pagamento recusado";
                toast.error(msg);
                setStatus("ready");
              }
            },
            onError: (err: unknown) => {
              console.error("Brick error", err);
            },
          },
        });
        if (cancelled) controller.unmount();
        else brickRef.current = controller;
      } catch (e) {
        console.error(e);
        setError("Falha ao montar o checkout");
      }
    })();
    return () => {
      cancelled = true;
      if (brickRef.current) {
        try { brickRef.current.unmount(); } catch { /* noop */ }
        brickRef.current = null;
      }
    };
  }, [status, data, user?.email, pay, tab]);

  const gerarPix = async () => {
    if (!data || !user?.email) return;
    setStatus("processing");
    try {
      const r = await pay({
        data: {
          subscriptionId: data.subscriptionId,
          payment_method_id: "pix",
          payer: { email: user.email },
        },
      });
      if (r.pix) {
        setPix(r.pix);
        setStatus("pending");
      } else if (r.status === "approved") {
        setStatus("approved");
      } else {
        setStatus("pending");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar Pix";
      toast.error(msg);
      setStatus("ready");
    }
  };

  const copyPix = async () => {
    if (!pix?.qrCode) return;
    await navigator.clipboard.writeText(pix.qrCode);
    toast.success("Código Pix copiado");
  };

  return (
    <AppShell title="Pagamento">
      <PageHero
        eyebrow="Checkout seguro"
        title={data?.title ?? "Pagamento"}
        subtitle={data ? `Total: R$ ${data.amount.toFixed(2)}` : "Carregando…"}
        icon={CreditCard}
        action={
          <Link
            to="/planos"
            className="size-11 rounded-2xl bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10 transition"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-5" />
          </Link>
        }
      />

      {status === "loading" && (
        <Card className="p-6 text-center text-sm text-muted-foreground">Preparando pagamento…</Card>
      )}

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 text-sm text-destructive">{error}</Card>
      )}

      {status === "approved" && (
        <Card className="p-6 text-center space-y-3">
          <CheckCircle2 className="size-12 mx-auto text-primary" />
          <p className="text-lg font-bold">Pagamento aprovado!</p>
          <p className="text-sm text-muted-foreground">Sua assinatura já está ativa.</p>
          <button
            onClick={() => nav({ to: "/planos" })}
            className="mt-2 inline-flex items-center justify-center rounded-2xl bg-primary text-primary-foreground px-5 py-2.5 font-bold text-sm"
          >
            VOLTAR AOS PLANOS
          </button>
        </Card>
      )}

      {status === "pending" && pix && (
        <Card className="p-5 space-y-4 text-center">
          <Clock className="size-10 mx-auto text-primary" />
          <p className="font-bold">Escaneie o QR Code para pagar via Pix</p>
          {pix.qrCodeBase64 && (
            <img
              src={`data:image/png;base64,${pix.qrCodeBase64}`}
              alt="QR Code Pix"
              className="size-56 mx-auto rounded-xl bg-white p-2"
            />
          )}
          {pix.qrCode && (
            <>
              <textarea
                readOnly
                value={pix.qrCode}
                className="w-full h-24 text-[10px] bg-white/5 border border-white/10 rounded-xl p-2 font-mono"
              />
              <button
                onClick={copyPix}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold"
              >
                <Copy className="size-3.5" /> COPIAR CÓDIGO PIX
              </button>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            A assinatura é ativada automaticamente após a confirmação do pagamento.
          </p>
        </Card>
      )}

      {status === "pending" && !pix && (
        <Card className="p-6 text-center space-y-2">
          <Clock className="size-10 mx-auto text-primary" />
          <p className="font-bold">Pagamento em análise</p>
          <p className="text-sm text-muted-foreground">Avisaremos assim que for confirmado.</p>
        </Card>
      )}

      {(status === "ready" || status === "processing") && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              onClick={() => setTab("pix")}
              className={`relative flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition border ${
                tab === "pix"
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                  : "bg-primary/10 border-primary/40 hover:bg-primary/20 text-primary"
              }`}
            >
              <QrCode className="size-4" /> PIX
              <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                RECOMENDADO
              </span>
            </button>
            <button
              onClick={() => setTab("card")}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition border ${
                tab === "card"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              }`}
            >
              <CreditCard className="size-4" /> CARTÃO
            </button>
          </div>

          {tab === "card" && (
            <Card className="p-2">
              <div id="vrum-mp-brick" ref={containerRef} />
            </Card>
          )}

          {tab === "pix" && (
            <Card className="p-6 text-center space-y-4">
              <QrCode className="size-12 mx-auto text-primary" />
              <p className="font-bold">Pague em segundos com Pix</p>
              <p className="text-xs text-muted-foreground">
                Geramos o QR Code aqui mesmo. Sem e-mail, sem etapas extras.
              </p>
              <button
                onClick={gerarPix}
                disabled={status === "processing"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground px-6 py-3 text-sm font-bold disabled:opacity-50"
              >
                {status === "processing" ? "GERANDO…" : "GERAR QR CODE PIX"}
              </button>
            </Card>
          )}

          {status === "processing" && (
            <p className="text-center text-xs text-muted-foreground mt-2">Processando pagamento…</p>
          )}
        </>
      )}
    </AppShell>
  );
}
