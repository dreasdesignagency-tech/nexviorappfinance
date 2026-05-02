import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.1?target=deno";

// Webhook is public (Stripe needs to call it without auth) — verified via signature.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
};

const PRICE_MENSAL = "price_1TRNmzFOt1xqRZ5erI2M5mbc";
const PRICE_ANUAL = "price_1TRNrUF0t1xqRZ5erI2M5mbc";

function planFromPriceId(priceId?: string | null): string | null {
  if (priceId === PRICE_MENSAL) return "mensal";
  if (priceId === PRICE_ANUAL) return "anual";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Missing config", { status: 500 });
  }
  const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = (session.metadata?.supabase_user_id ??
          (session.subscription as any)?.metadata?.supabase_user_id) as
            | string
            | undefined;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;
        if (!userId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        const planType = planFromPriceId(priceId) ??
          (session.metadata?.plan_type as string | undefined) ?? null;

        await admin
          .from("user_subscriptions")
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_status: sub.status,
              plan_type: planType,
              current_period_start: new Date(
                sub.current_period_start * 1000,
              ).toISOString(),
              current_period_end: new Date(
                sub.current_period_end * 1000,
              ).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
              canceled_at: sub.canceled_at
                ? new Date(sub.canceled_at * 1000).toISOString()
                : null,
            },
            { onConflict: "user_id" },
          );
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userId = (sub.metadata?.supabase_user_id as string | undefined) ??
          null;
        const priceId = sub.items.data[0]?.price?.id;
        const planType = planFromPriceId(priceId);

        // Find row by stripe_customer_id or stripe_subscription_id
        let row;
        if (userId) {
          const r = await admin
            .from("user_subscriptions")
            .select("id")
            .eq("user_id", userId)
            .maybeSingle();
          row = r.data;
        }
        if (!row) {
          const r = await admin
            .from("user_subscriptions")
            .select("id, user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();
          row = r.data;
        }
        if (!row) {
          console.warn("No matching subscription row for customer", customerId);
          break;
        }

        await admin
          .from("user_subscriptions")
          .update({
            stripe_subscription_id: sub.id,
            stripe_customer_id: customerId,
            subscription_status:
              event.type === "customer.subscription.deleted"
                ? "canceled"
                : sub.status,
            plan_type: planType ?? undefined,
            current_period_start: new Date(
              sub.current_period_start * 1000,
            ).toISOString(),
            current_period_end: new Date(
              sub.current_period_end * 1000,
            ).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
          })
          .eq("id", row.id);
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (e) {
    console.error("stripe-webhook handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
