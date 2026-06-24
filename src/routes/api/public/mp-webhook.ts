import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
        if (!token) return new Response("no token", { status: 200 });

        let paymentId: string | null = null;
        try {
          const url = new URL(request.url);
          paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
          if (!paymentId) {
            const body = (await request.json().catch(() => null)) as
              | { data?: { id?: string | number }; type?: string; resource?: string }
              | null;
            if (body?.data?.id) paymentId = String(body.data.id);
            else if (body?.resource) paymentId = String(body.resource).split("/").pop() || null;
          }
        } catch {
          /* ignore */
        }
        if (!paymentId) return new Response("ok", { status: 200 });

        const r = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) return new Response("ok", { status: 200 });
        const pay = (await r.json()) as {
          status?: string;
          external_reference?: string;
          id?: number;
        };

        if (pay.status !== "approved" || !pay.external_reference) {
          return new Response("ok", { status: 200 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: sub } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan_id, plans:plan_id(period)")
          .eq("id", pay.external_reference)
          .maybeSingle();
        if (!sub) return new Response("ok", { status: 200 });

        const period = (sub as { plans?: { period?: string } }).plans?.period || "mensal";
        const days = period === "anual" ? 365 : period === "trimestral" ? 90 : 30;
        const expires = new Date(Date.now() + days * 86400 * 1000).toISOString();

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "ativo",
            mp_payment_id: String(pay.id),
            started_at: new Date().toISOString(),
            expires_at: expires,
          })
          .eq("id", sub.id);

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("ok", { status: 200 }),
    },
  },
});
