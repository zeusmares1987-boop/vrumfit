import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Initialize transparent checkout: creates pending subscription and returns
// the data the Mercado Pago Bricks SDK needs to mount on the client.
export const createMpCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { planId: string }) =>
    z.object({ planId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const publicKey = process.env.MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) throw new Error("PAYMENT_UNAVAILABLE");
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: plan, error: planErr } = await supabase
      .from("plans")
      .select("id,name,price_cents")
      .eq("id", data.planId)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Plano não encontrado");

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .insert({ user_id: userId, plan_id: plan.id, status: "pendente" })
      .select("id")
      .single();
    if (subErr || !sub) throw new Error(subErr?.message || "Falha ao criar assinatura");

    return {
      subscriptionId: sub.id,
      publicKey,
      amount: plan.price_cents / 100,
      title: `VRUMFIT — ${plan.name}`,
    };
  });

// Process payment using the token + payment_method_id produced by Bricks.
// Supports credit_card, debit_card and pix.
export const processMpPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    subscriptionId: string;
    token?: string;
    issuer_id?: string;
    payment_method_id: string;
    installments?: number;
    payer: { email: string; identification?: { type: string; number: string } };
  }) =>
    z.object({
      subscriptionId: z.string().uuid(),
      token: z.string().optional(),
      issuer_id: z.string().optional(),
      payment_method_id: z.string(),
      installments: z.number().int().positive().optional(),
      payer: z.object({
        email: z.string().email(),
        identification: z.object({ type: z.string(), number: z.string() }).optional(),
      }),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const appUrl = process.env.APP_URL || "https://vrumvrum.art.br";
    if (!accessToken) throw new Error("PAYMENT_UNAVAILABLE");
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sub, error: subErr } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, plan:plan_id(name, price_cents)")
      .eq("id", data.subscriptionId)
      .maybeSingle();
    if (subErr || !sub) throw new Error("Assinatura não encontrada");
    if (sub.user_id !== userId) throw new Error("FORBIDDEN");
    const plan = sub.plan as unknown as { name: string; price_cents: number } | null;
    if (!plan) throw new Error("Plano não encontrado");

    const body: Record<string, unknown> = {
      transaction_amount: plan.price_cents / 100,
      description: `VRUMFIT — ${plan.name}`,
      payment_method_id: data.payment_method_id,
      payer: data.payer,
      external_reference: sub.id,
      notification_url: `${appUrl}/api/public/mp-webhook`,
    };
    if (data.token) body.token = data.token;
    if (data.issuer_id) body.issuer_id = data.issuer_id;
    if (data.installments) body.installments = data.installments;

    let json: {
      id?: number;
      status?: string;
      status_detail?: string;
      point_of_interaction?: {
        transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string };
      };
      message?: string;
    };
    try {
      const res = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${sub.id}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      });
      json = (await res.json()) as typeof json;
      if (!res.ok) {
        console.error("MP payment error", json);
        await supabaseAdmin.from("subscriptions").update({ status: "cancelado" }).eq("id", sub.id);
        throw new Error(json.message || "Pagamento recusado");
      }
    } catch (error) {
      await supabaseAdmin.from("subscriptions").update({ status: "cancelado" }).eq("id", sub.id);
      if (error instanceof Error) throw error;
      throw new Error("Pagamento recusado");
    }
    if (json.status === "approved") {
      const days = 30;
      const expires = new Date(Date.now() + days * 86400 * 1000).toISOString();
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "ativo",
          mp_payment_id: json.id ? String(json.id) : null,
          started_at: new Date().toISOString(),
          expires_at: expires,
        })
        .eq("id", sub.id);
    }
    return {
      id: json.id,
      status: json.status,
      statusDetail: json.status_detail,
      pix: json.point_of_interaction?.transaction_data
        ? {
            qrCode: json.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: json.point_of_interaction.transaction_data.qr_code_base64,
            ticketUrl: json.point_of_interaction.transaction_data.ticket_url,
          }
        : null,
    };
  });
