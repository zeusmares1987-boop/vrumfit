import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createMpCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planId: string }) =>
    z.object({ planId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || "https://vrumvrum.art.br";
    if (!token) throw new Error("PAYMENT_UNAVAILABLE");

    const { supabase, userId } = context;

    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("id,name,price_cents")
      .eq("id", data.planId)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Plano não encontrado");

    const { data: sub, error: subErr } = await supabase
      .from("subscriptions")
      .insert({ user_id: userId, plan_id: plan.id, status: "pendente" as never })
      .select("id")
      .single();
    if (subErr || !sub) throw new Error(subErr?.message || "Falha ao criar assinatura");

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `VRUMFIT — ${plan.name}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: plan.price_cents / 100,
          },
        ],
        external_reference: sub.id,
        payment_methods: { excluded_payment_types: [{ id: "ticket" }] },
        back_urls: {
          success: `${appUrl}/planos?sub=ok`,
          failure: `${appUrl}/planos?sub=erro`,
          pending: `${appUrl}/planos?sub=pendente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/public/mp-webhook`,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("MP preference error", t);
      throw new Error("PAYMENT_UNAVAILABLE");
    }
    const pref = (await res.json()) as { init_point?: string; sandbox_init_point?: string };
    const url = pref.init_point || pref.sandbox_init_point;
    if (!url) throw new Error("PAYMENT_UNAVAILABLE");
    return { url, subscriptionId: sub.id };
  });
