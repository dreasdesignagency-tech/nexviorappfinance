import { useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react";
import { supabaseConfig } from "@/lib/supabase";
import { useTransactions } from "@/store/transactions";
import { useCards } from "@/store/cards";
import { useRecurrents } from "@/store/recurrents";
import { useLimits } from "@/store/limits";
import { useProfile } from "@/store/profile";

type Msg = { role: "user" | "assistant"; content: string };

const SUGESTOES = [
  "Como estão meus gastos esse mês?",
  "Onde posso economizar?",
  "Análise minha saúde financeira",
  "Dicas para investir melhor",
];

const NexIA = () => {
  const { profile } = useProfile();
  const { transactions, totalReceitas, totalDespesas, saldo } = useTransactions();
  const { cards } = useCards();
  const { parcelas, assinaturas, totalMensalParcelas, totalMensalAssinaturas } = useRecurrents();
  const { limits, investments, totalInvestido, patrimonioAtual, lucroPrejuizo, rentabilidadeMedia } = useLimits();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const contextoFinanceiro = useMemo(() => {
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    const doMes = transactions.filter((t) => {
      const [y, m] = t.data.split("-").map(Number);
      return y === anoAtual && m - 1 === mesAtual;
    });
    const despesasMes = doMes.filter((t) => t.tipo === "despesa").reduce((s, t) => s + t.valor, 0);
    const receitasMes = doMes.filter((t) => t.tipo === "receita").reduce((s, t) => s + t.valor, 0);

    const porCategoria: Record<string, number> = {};
    for (const t of transactions) {
      if (t.tipo === "despesa") porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + t.valor;
    }
    const topCategorias = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, val]) => ({ categoria: cat, total: val }));

    const investidoCategoria = transactions
      .filter((t) => t.tipo === "despesa" && t.categoria === "Investimentos")
      .reduce((s, t) => s + t.valor, 0);
    const investidoFinal = totalInvestido > 0 ? totalInvestido : investidoCategoria;

    return {
      usuario: { nome: profile.nome },
      resumo: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo,
        total_investido: investidoFinal,
        patrimonio_atual: patrimonioAtual,
        lucro_prejuizo: lucroPrejuizo,
        rentabilidade_media_pct: rentabilidadeMedia,
      },
      mes_atual: {
        ano: anoAtual,
        mes: mesAtual + 1,
        receitas: receitasMes,
        despesas: despesasMes,
        saldo: receitasMes - despesasMes,
        qtd_transacoes: doMes.length,
      },
      top_categorias_despesa: topCategorias,
      cartoes: cards.map((c) => ({ nome: c.nome, banco: c.banco, tipo: c.tipo, limite: c.limite })),
      parcelas: {
        total: parcelas.length,
        em_andamento: parcelas.filter((p) => p.status === "Em andamento").length,
        comprometido_mensal: totalMensalParcelas,
      },
      assinaturas: {
        total_ativas: assinaturas.filter((a) => a.status === "ativa").length,
        comprometido_mensal: totalMensalAssinaturas,
      },
      ultimas_transacoes: transactions.slice(0, 8).map((t) => ({
        data: t.data,
        tipo: t.tipo,
        titulo: t.titulo,
        categoria: t.categoria,
        valor: t.valor,
      })),
      limites: limits.map((l) => ({
        categoria: l.categoria,
        valor_limite: l.valor_limite,
        periodo: l.periodo,
      })),
      investimentos: investments.map((i) => ({
        nome: i.nome,
        tipo: i.tipo,
        valor_investido: i.valor_investido,
        valor_atual: i.valor_atual,
      })),
    };
  }, [transactions, cards, parcelas, assinaturas, totalReceitas, totalDespesas, saldo, totalMensalParcelas, totalMensalAssinaturas, profile.nome, limits, investments, totalInvestido, patrimonioAtual, lucroPrejuizo, rentabilidadeMedia]);

  const enviarMensagem = async (texto: string) => {
    if (!texto.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: texto.trim() };
    const novasMsgs = [...messages, userMsg];
    setMessages(novasMsgs);
    setInput("");
    setIsLoading(true);

    try {
      const url = `${supabaseConfig.url}/functions/v1/nex-ia-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: novasMsgs.map((m) => ({ role: m.role, content: m.content })),
          contextoFinanceiro,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const errMsg =
          resp.status === 429
            ? "⚠️ Muitas requisições. Aguarde um instante e tente novamente."
            : resp.status === 402
            ? "⚠️ Créditos de IA esgotados. Adicione créditos no workspace."
            : err.error || "Não consegui responder agora. Tente novamente.";
        setMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
        setIsLoading(false);
        return;
      }
      if (!resp.body) throw new Error("Stream vazio");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";
      let started = false;
      let streamDone = false;

      const upsert = (chunk: string) => {
        assistantContent += chunk;
        setMessages((prev) => {
          if (!started) {
            started = true;
            return [...prev, { role: "assistant", content: assistantContent }];
          }
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        });
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            streamDone = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Não consegui responder agora. Tente novamente em instantes." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i} className="text-foreground">{p.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen flex bg-background gradient-mesh">
      <Sidebar />
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-x-hidden">
        {/* Top bar minimalista */}
        <div className="flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 md:py-5 pl-16 md:pl-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20 shrink-0">
              <Sparkles className="w-5 h-5 text-primary-glow" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-foreground leading-tight">nex.ia</h1>
              <p className="text-xs text-muted-foreground truncate">Seu mentor financeiro pessoal</p>
            </div>
          </div>
          {!isEmpty && (
            <button
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova conversa</span>
            </button>
          )}
        </div>

        {/* Conteúdo central */}
        <div className="flex-1 flex flex-col items-center justify-center px-3 sm:px-4 md:px-8 overflow-hidden min-h-0">
          {isEmpty ? (
            <div className="w-full max-w-2xl flex flex-col items-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border border-primary/20 mb-6 glow-primary">
                <Sparkles className="w-8 h-8 text-primary-glow" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-3">
                Olá! Sou a nex.ia 👋
              </h2>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                Sua mentora financeira pessoal. Posso analisar seus gastos, dar dicas e ajudar a organizar suas finanças.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviarMensagem(s)}
                    disabled={isLoading}
                    className="text-sm px-4 py-3 rounded-2xl glass-inner text-muted-foreground hover:text-foreground hover:border-primary/40 border border-border/40 transition-all text-left disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="w-full max-w-2xl flex-1 overflow-y-auto py-6 space-y-4"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-br-md"
                        : "glass-inner text-foreground rounded-bl-md"
                    }`}
                  >
                    {renderContent(m.content)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-inner rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    nex.ia está pensando...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input fixo embaixo */}
        <div className="px-3 sm:px-4 md:px-8 pb-20 md:pb-8 pt-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensagem(input);
            }}
            className="w-full max-w-2xl mx-auto flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo à nex.ia..."
              disabled={isLoading}
              className="flex-1 h-12 px-5 rounded-full glass-inner border border-border/40 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-12 w-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center glow-primary disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Enviar"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NexIA;
