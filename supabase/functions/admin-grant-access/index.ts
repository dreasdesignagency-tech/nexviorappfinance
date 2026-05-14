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
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }

    // Cliente com o JWT do admin chamador (para auth.uid() funcionar nos RPCs)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1) Verifica autenticação e papel admin
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "unauthorized" }, 401);

    const { data: roleRow, error: roleErr } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleErr || !roleRow) return json({ error: "forbidden" }, 403);

    // 2) Body
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const planType = String(body.plan_type ?? "free_access");
    const note = body.note ? String(body.note) : null;
    const redirectTo = body.redirect_to ? String(body.redirect_to) : undefined;

    if (!EMAIL_RE.test(email)) return json({ error: "email inválido" }, 400);

    // 3) Cria/atualiza grant via RPC (auth.uid() = admin chamador)
    const { data: grantResult, error: grantErr } = await userClient.rpc("admin_grant_access", {
      _email: email,
      _plan_type: planType,
      _note: note,
    });
    if (grantErr) {
      console.error("[admin-grant-access] grant rpc failed", grantErr);
      return json({ error: "Falha ao registrar acesso: " + grantErr.message }, 500);
    }

    const existingUserId =
      (grantResult as any)?.existing_user_id ?? null;
    const activatedImmediately = Boolean(
      (grantResult as any)?.activated_immediately,
    );

    // 4) Envio de email + link de fallback
    let emailSent = false;
    let emailError: string | null = null;
    let actionLink: string | null = null;
    let invitedUserId: string | null = null;

    if (existingUserId) {
      // Usuário já existe → magic link (envia email automaticamente)
      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      if (linkErr) {
        emailError = linkErr.message;
      } else {
        actionLink = (linkData as any)?.properties?.action_link ?? null;
        // generateLink dispara o email automaticamente quando SMTP está configurado
        emailSent = Boolean(actionLink);
      }
    } else {
      // Usuário novo → invite (envia email se SMTP ok)
      const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { granted_plan: planType, granted_by_admin: true },
      });
      if (inviteErr) {
        emailError = inviteErr.message;
        // Fallback: gera signup link para copiar manualmente
        const { data: signupLink, error: signupErr } = await admin.auth.admin.generateLink({
          type: "signup",
          email,
          password: crypto.randomUUID(),
          options: { redirectTo },
        });
        if (!signupErr) {
          actionLink = (signupLink as any)?.properties?.action_link ?? null;
        }
      } else {
        invitedUserId = invited?.user?.id ?? null;
        emailSent = true;
        // generateLink invite também — pode não estar disponível no payload
        actionLink = (invited as any)?.properties?.action_link ?? null;
      }
    }

    return json({
      ok: true,
      email,
      plan_type: planType,
      existing_user_id: existingUserId,
      invited_user_id: invitedUserId,
      activated_immediately: activatedImmediately,
      email_sent: emailSent,
      email_error: emailError,
      action_link: actionLink,
    });
  } catch (e: any) {
    console.error("[admin-grant-access] uncaught", e);
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
