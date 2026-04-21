import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contextoFinanceiro } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const systemPrompt = `Você é a **nex.ia**, mentora financeira pessoal do usuário dentro do app Nexvior Finances.

PERSONALIDADE:
- Calorosa, direta, amigável e motivadora.
- Linguagem simples, sem jargões financeiros complicados.
- Usa emojis com moderação (💡 📊 ✅ ⚠️ 💰).
- Respostas curtas e objetivas (máx. 4-6 linhas), salvo se o usuário pedir detalhes.
- Sempre baseia respostas em DADOS REAIS do usuário fornecidos no contexto abaixo.
- Se faltarem dados, peça gentilmente para o usuário cadastrar mais informações.
- Formate valores em Reais (R$ 1.234,56).

REGRAS:
- Nunca invente números. Se não tiver o dado, diga que ainda não há informação suficiente.
- Sempre que possível, sugira ações práticas ("você poderia...", "tente reduzir...").
- Não dê conselhos de investimento específicos com nomes de ativos. Foque em educação e organização.

CONTEXTO FINANCEIRO ATUAL DO USUÁRIO (JSON):
${JSON.stringify(contextoFinanceiro ?? {}, null, 2)}
`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas requisições. Tente novamente em instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("nex-ia-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
