import { Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTransactions } from "@/store/transactions";
import { useRecurrents } from "@/store/recurrents";
import { useLimits } from "@/store/limits";

interface Insight {
  priority: number;
  title: string;
  recommendation: string;
}

export const AIInsights = () => {
  const { transactions, totalReceitas, totalDespesas, saldo } = useTransactions();
  const { assinaturas, parcelas, totalMensalAssinaturas } = useRecurrents();
  const { limits, investments } = useLimits();
  const [cycle, setCycle] = useState(0);

  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    if (transactions.length === 0) {
      return [{
        priority: 0,
        title: "Adicione suas movimentações para receber insights da nex.ia.",
        recommendation: "Cadastre receitas e despesas para começarmos sua análise.",
      }];
    }

    // 1. Despesas > Receitas
    if (totalDespesas > totalReceitas) {
      list.push({
        priority: 10,
        title: "Você teve mais despesas do que receitas neste período.",
        recommendation: "Revise gastos não essenciais para reequilibrar seu mês.",
      });
    }

    // 2. Categoria com maior gasto
    const byCat: Record<string, number> = {};
    for (const t of transactions) {
      if (t.tipo === "despesa") byCat[t.categoria] = (byCat[t.categoria] || 0) + t.valor;
    }
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    if (topCat && totalDespesas > 0 && topCat[1] / totalDespesas > 0.3) {
      list.push({
        priority: 8,
        title: `Sua maior categoria de gasto é ${topCat[0]}.`,
        recommendation: `Considere definir um limite para ${topCat[0]}.`,
      });
    }

    // 3. Assinaturas pesadas
    const ativas = assinaturas.filter((a) => a.status === "ativa").length;
    if (ativas >= 4 || (totalReceitas > 0 && totalMensalAssinaturas / totalReceitas > 0.15)) {
      list.push({
        priority: 7,
        title: `Você tem ${ativas} assinaturas ativas pesando no orçamento.`,
        recommendation: "Considere revisar suas assinaturas e cancelar as que não usa.",
      });
    }

    // 4. Limites excedidos
    for (const l of limits) {
      const gasto = byCat[l.categoria] || 0;
      if (gasto > l.valor_limite) {
        list.push({
          priority: 9,
          title: `Limite de ${l.categoria} excedido.`,
          recommendation: `Você gastou acima do limite definido para ${l.categoria}.`,
        });
        break;
      }
    }

    // 5. Sem limites
    if (limits.length === 0 && transactions.some((t) => t.tipo === "despesa")) {
      list.push({
        priority: 5,
        title: "Você ainda não definiu limites para suas categorias.",
        recommendation: "Defina limites para controlar melhor seus gastos.",
      });
    }

    // 6. Sem investimentos
    if (investments.length === 0) {
      list.push({
        priority: 4,
        title: "Você ainda não registrou nenhum investimento.",
        recommendation: "Registrar seus investimentos melhora sua análise financeira.",
      });
    }

    // 7. Parcelas em andamento
    const parcelasAtivas = parcelas.filter((p) => p.status === "Em andamento").length;
    if (parcelasAtivas >= 3) {
      list.push({
        priority: 6,
        title: `Você tem ${parcelasAtivas} compras parceladas em andamento.`,
        recommendation: "Evite novos parcelamentos até quitar os atuais.",
      });
    }

    // 8. Saldo positivo
    if (saldo > 0 && totalReceitas > 0) {
      const taxa = saldo / totalReceitas;
      if (taxa > 0.3) {
        list.push({
          priority: 3,
          title: "Seu saldo está positivo — boa oportunidade de investir.",
          recommendation: "Direcione parte do excedente para uma reserva ou investimento.",
        });
      } else {
        list.push({
          priority: 2,
          title: "Sua saúde financeira está estável neste período.",
          recommendation: "Crie uma meta de reserva de emergência para evoluir.",
        });
      }
    }

    if (list.length === 0) {
      list.push({
        priority: 1,
        title: "Tudo equilibrado por aqui.",
        recommendation: "Continue acompanhando suas movimentações com a nex.ia.",
      });
    }

    return list.sort((a, b) => b.priority - a.priority);
  }, [transactions, totalReceitas, totalDespesas, saldo, assinaturas, parcelas, limits, investments, totalMensalAssinaturas]);

  const current = insights[cycle % insights.length];

  return (
    <div className="glass-card p-5 md:p-5 relative overflow-hidden border border-border/50 bg-surface-elevated/10">
      <div className="flex items-center justify-between mb-3 md:mb-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
          </div>
          <h3 className="text-sm font-semibold">Insight da nex.ia</h3>
        </div>
        {insights.length > 1 && (
          <button
            onClick={() => setCycle((c) => c + 1)}
            className="w-7 h-7 rounded-full glass-inner hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            aria-label="Gerar novo insight"
            title="Gerar novo insight"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      <p className="text-sm md:text-sm text-foreground leading-relaxed">{current.title}</p>
      <p className="text-[13px] md:text-xs text-muted-foreground mt-2 leading-relaxed">{current.recommendation}</p>

      <Link
        to="/nex-ia"
        className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary-glow font-medium hover:gap-2 transition-all break-words"
      >
        Conversar com a nex.ia <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};
