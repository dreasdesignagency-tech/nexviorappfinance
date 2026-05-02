import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRICE_MENSAL = "price_1TRNmzFOt1xqRZ5erI2M5mbc";
const PRICE_ANUAL = "price_1TRNrUF0t1xqRZ5erI2M5mbc";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      token,
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;
    const email = claims.claims.email as string | undefined;

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as "mensal" | "anual" | undefined;
    const origin = body?.origin as string | undefined;

    if (plan !== "mensal" && plan !== "anual") {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const priceId = plan === "mensal" ? PRICE_MENSAL : PRICE_ANUAL;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Service-role client to read/write subscription record
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: existing } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      // Try to find by email; otherwise create
      if (email) {
        const found = await stripe.customers.list({ email, limit: 1 });
        if (found.data[0]) customerId = found.data[0].id;
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          email,
          metadata: { supabase_user_id: userId },
        });
        customerId = created.id;
      }
      await admin
        .from("user_subscriptions")
        .upsert(
          { user_id: userId, stripe_customer_id: customerId },
          { onConflict: "user_id" },
        );
    }

    const baseUrl = origin || req.headers.get("origin") ||
      "https://nexviorappfinance.lovable.app";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/planos`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { supabase_user_id: userId, plan_type: plan },
      },
      metadata: { supabase_user_id: userId, plan_type: plan },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
