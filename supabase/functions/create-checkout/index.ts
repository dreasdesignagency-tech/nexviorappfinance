import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PRICE_MENSAL = "price_1TSdsZ2asWCLjZqeOIwfhiOd";
const PRICE_ANUAL = "price_1TSdx62asWCLjZqe7NuEeKff";

const log = (msg: string, data?: unknown) => {
  if (data !== undefined) {
    console.log(`[create-checkout] ${msg}`, JSON.stringify(data));
  } else {
    console.log(`[create-checkout] ${msg}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("request received", { method: req.method });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      log("missing bearer token");
      return new Response(JSON.stringify({ error: "Unauthorized: missing token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnon || !serviceRole) {
      log("missing supabase env");
      return new Response(JSON.stringify({ error: "Server misconfigured (supabase env)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!stripeKey) {
      log("missing STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log("stripe key mode", { live: stripeKey.startsWith("sk_live_"), test: stripeKey.startsWith("sk_test_") });

    // Validate user via auth.getUser
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      log("auth.getUser failed", { error: userErr?.message });
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const email = userData.user.email ?? undefined;
    log("user authenticated", { userId, email });

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as "mensal" | "anual" | undefined;
    const origin = body?.origin as string | undefined;
    log("body parsed", { plan, origin });

    if (plan !== "mensal" && plan !== "anual") {
      log("invalid plan", { plan });
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const priceId = plan === "mensal" ? PRICE_MENSAL : PRICE_ANUAL;
    log("price selected", { plan, priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    const admin = createClient(supabaseUrl, serviceRole);
    const { data: existing, error: existingErr } = await admin
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existingErr) {
      log("user_subscriptions read error", { error: existingErr.message });
    }

    let customerId = existing?.stripe_customer_id ?? null;
    if (!customerId) {
      if (email) {
        try {
          const found = await stripe.customers.list({ email, limit: 1 });
          if (found.data[0]) customerId = found.data[0].id;
        } catch (e) {
          log("stripe customers.list failed", { error: (e as Error).message });
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          email,
          metadata: { supabase_user_id: userId },
        });
        customerId = created.id;
        log("stripe customer created", { customerId });
      } else {
        log("stripe customer matched by email", { customerId });
      }
      const { error: upsertErr } = await admin
        .from("user_subscriptions")
        .upsert(
          { user_id: userId, stripe_customer_id: customerId },
          { onConflict: "user_id" },
        );
      if (upsertErr) log("user_subscriptions upsert error", { error: upsertErr.message });
    } else {
      log("stripe customer reused", { customerId });
    }

    const baseUrl = origin || req.headers.get("origin") ||
      "https://nexviorappfinance.vercel.app";
    log("base url", { baseUrl });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId!,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${baseUrl}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/planos`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: { supabase_user_id: userId, plan_type: plan },
        },
        metadata: { supabase_user_id: userId, plan_type: plan, email: email ?? "" },
      });
    } catch (stripeErr) {
      const err = stripeErr as { message?: string; type?: string; code?: string; raw?: unknown };
      log("stripe.checkout.sessions.create FAILED", {
        message: err.message,
        type: err.type,
        code: err.code,
      });
      return new Response(
        JSON.stringify({
          error: "Stripe error",
          stripe_message: err.message,
          stripe_code: err.code,
          stripe_type: err.type,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("checkout session created", { id: session.id, url: session.url });
    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const err = e as Error;
    console.error("[create-checkout] unhandled error", err.message, err.stack);
    return new Response(
      JSON.stringify({ error: err.message ?? "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
