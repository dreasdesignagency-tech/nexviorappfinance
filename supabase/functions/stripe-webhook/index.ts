import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.1?target=deno";

// Webhook is public (Stripe needs to call it without auth) — verified via signature.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, stripe-signature",
};

const PRICE_MENSAL = "price_1TYBHH2asWCLjZqebEO6PjNu";
const PRICE_ANUAL = "price_1TYBNz2asWCLjZqeRWYgw99C";

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

  // Find a Supabase user_id by checking metadata, client_reference_id, customer, or email.
  async function resolveUserId(opts: {
    metadataUserId?: string | null;
    clientReferenceId?: string | null;
    customerId?: string | null;
    email?: string | null;
  }): Promise<string | null> {
    if (opts.metadataUserId) return opts.metadataUserId;
    if (opts.clientReferenceId) return opts.clientReferenceId;

    if (opts.customerId) {
      const r = await admin
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", opts.customerId)
        .maybeSingle();
      if (r.data?.user_id) return r.data.user_id as string;
    }

    if (opts.email) {
      // Search auth users by email
      try {
        // @ts-ignore - admin API
        const { data, error } = await admin.auth.admin.listUsers({
          page: 1,
          perPage: 200,
        });
        if (!error && data?.users) {
          const match = data.users.find(
            (u: any) => u.email?.toLowerCase() === opts.email!.toLowerCase(),
          );
          if (match) return match.id as string;
        }
      } catch (e) {
        console.error("listUsers failed", e);
      }
    }
    return null;
  }

  async function upsertFromSubscription(
    userId: string,
    sub: Stripe.Subscription,
    customerId: string | null,
  ) {
    const priceId = sub.items.data[0]?.price?.id;
    const planType = planFromPriceId(priceId);
    await admin.from("user_subscriptions").upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        plan_type: planType,
        current_period_start: new Date(sub.current_period_start * 1000)
          .toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000)
          .toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at
          ? new Date(sub.canceled_at * 1000).toISOString()
          : null,
      },
      { onConflict: "user_id" },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string | null;
        const customerId = session.customer as string | null;
        const email = session.customer_details?.email ??
          session.customer_email ?? null;

        const userId = await resolveUserId({
          metadataUserId: session.metadata?.supabase_user_id,
          clientReferenceId: session.client_reference_id,
          customerId,
          email,
        });
        if (!userId || !subscriptionId) {
          console.warn("checkout.session.completed: missing userId or subscriptionId", {
            userId, subscriptionId, email,
          });
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(userId, sub, customerId);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        // Try to fetch customer email for fallback matching
        let email: string | null = null;
        try {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !(customer as any).deleted) {
            email = (customer as Stripe.Customer).email ?? null;
          }
        } catch (_) { /* ignore */ }

        const userId = await resolveUserId({
          metadataUserId: sub.metadata?.supabase_user_id,
          customerId,
          email,
        });
        if (!userId) {
          console.warn("subscription event: no matching user", { customerId, email });
          break;
        }

        const status = event.type === "customer.subscription.deleted"
          ? "canceled"
          : sub.status;

        await admin.from("user_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            subscription_status: status,
            plan_type: planFromPriceId(sub.items.data[0]?.price?.id) ?? undefined,
            current_period_start: new Date(sub.current_period_start * 1000)
              .toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000)
              .toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            canceled_at: sub.canceled_at
              ? new Date(sub.canceled_at * 1000).toISOString()
              : null,
          },
          { onConflict: "user_id" },
        );
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string | null;
        const customerId = invoice.customer as string | null;
        if (!subscriptionId || !customerId) break;

        let email: string | null = invoice.customer_email ?? null;
        if (!email) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer && !(customer as any).deleted) {
              email = (customer as Stripe.Customer).email ?? null;
            }
          } catch (_) { /* ignore */ }
        }

        const userId = await resolveUserId({ customerId, email });
        if (!userId) {
          console.warn("invoice event: no matching user", { customerId, email });
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(userId, sub, customerId);
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
