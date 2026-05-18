import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = body.full_name ? String(body.full_name).trim() : "";
    const phone = body.phone ? String(body.phone).trim() : "";
    const grantFreeAccess = body.grant_free_access !== false; // default true

    if (!EMAIL_RE.test(email)) return json({ error: "Email inválido" }, 400);
    if (password.length < 6) return json({ error: "Senha deve ter pelo menos 6 caracteres" }, 400);

    // Cria usuário já confirmado
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone: phone || undefined,
      phone_confirm: phone ? true : undefined,
      user_metadata: {
        full_name: fullName,
        phone,
        created_by_admin: true,
      },
    });

    if (createErr || !created?.user) {
      return json({ error: createErr?.message ?? "Falha ao criar usuário" }, 400);
    }

    const newUserId = created.user.id;

    // Garante profile (caso trigger não rode)
    await admin
      .from("profiles")
      .upsert({ id: newUserId, full_name: fullName, phone }, { onConflict: "id" });

    // Libera acesso gratuito por padrão
    if (grantFreeAccess) {
      await admin
        .from("user_subscriptions")
        .upsert(
          { user_id: newUserId, subscription_status: "active", plan_type: "free_access" },
          { onConflict: "user_id" },
        );
    }

    return json({
      ok: true,
      user_id: newUserId,
      email,
      free_access: grantFreeAccess,
    });
  } catch (e: any) {
    console.error("[admin-create-user]", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
