import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verifica se quem chamou é admin
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdminData, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const planType = String(body.plan_type ?? "free_access");
    const note = body.note ? String(body.note) : null;
    const redirectTo = body.redirect_to ? String(body.redirect_to) : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "email inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Cria/atualiza grant + ativa imediatamente se já existir
    const { data: grantResult, error: grantErr } = await admin.rpc("admin_grant_access", {
      _email: email,
      _plan_type: planType,
      _note: note,
    });
    // O RPC respeita has_role(auth.uid()) — chamamos via service role então pulamos a checagem fazendo manualmente
    // Como service role bypassa RLS mas a função usa auth.uid()=null, precisamos rodar o INSERT direto:
    if (grantErr) {
      // Fallback direto via service role
      await admin.from("access_grants").upsert(
        {
          email,
          plan_type: planType,
          note,
          granted_by: userData.user.id,
          granted_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );

      // Verifica se usuário existe
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = existing?.users?.find((u) => (u.email ?? "").toLowerCase() === email);
      if (found) {
        await admin.from("user_subscriptions").upsert(
          {
            user_id: found.id,
            subscription_status: "active",
            plan_type: planType,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
        await admin
          .from("access_grants")
          .update({ claimed_user_id: found.id, claimed_at: new Date().toISOString() })
          .eq("email", email);
      }
    }

    // 2) Envia o convite por email (Supabase Auth: cria usuário se não existir, ou envia magic link se existir)
    let emailSent = false;
    let emailError: string | null = null;

    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { granted_plan: planType, granted_by_admin: true },
    });

    if (inviteErr) {
      // Se já existe, manda magic link
      const { error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (linkErr) {
        emailError = inviteErr.message;
      } else {
        emailSent = true;
      }
    } else {
      emailSent = true;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        email,
        plan_type: planType,
        granted: grantResult ?? null,
        invited_user_id: invited?.user?.id ?? null,
        email_sent: emailSent,
        email_error: emailError,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
