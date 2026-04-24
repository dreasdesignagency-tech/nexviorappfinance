import { ChevronRight, HeartPulse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useTransactions } from "@/store/transactions";
import { useRecurrents } from "@/store/recurrents";
import { useLimits } from "@/store/limits";

type Classificacao = "Crítica" | "Atenção" | "Boa" | "Excelente";

const classify = (score: number): Classificacao => {
  if (score < 40) return "Crítica";
  if (score < 60) return "Atenção";
  if (score < 80) return "Boa";
  return "Excelente";
};

const resumoPorClass: Record<Classificacao, { line1: string; line2: string }> = {
  "Crítica": { line1: "Seus gastos estão", line2: "comprometendo sua renda" },
  "Atenção": { line1: "Há pontos importantes", line2: "para ajustar" },
  "Boa": { line1: "Há espaço para melhorar", line2: "sua reserva e limites" },
  "Excelente": { line1: "Sua organização financeira", line2: "está saudável" },
};

export const FinancialHealthCard = () => {
  const navigate = useNavigate();
  const { transactions, totalReceitas, totalDespesas, saldo } = useTransactions();
  const { totalMensalParcelas, totalMensalAssinaturas } = useRecurrents();
  const { totalInvestido: totalInvestidoStore, patrimonioAtual } = useLimits();

  const score = useMemo(() => {
    if (transactions.length === 0) return 0;
    const investidoCategoria = transactions
      .filter((t) => t.categoria === "Investimentos" && t.tipo === "despesa")
      .reduce((s, t) => s + t.valor, 0);
    const totalInvestido = totalInvestidoStore > 0 ? patrimonioAtual : investidoCategoria;
    const reserva = Math.max(0, saldo);
    const mesesUnicos = new Set(
      transactions.filter((t) => t.tipo === "despesa").map((t) => t.data.slice(0, 7))
    );
    const nMeses = Math.max(1, mesesUnicos.size);
    const despesaMediaMensal = totalDespesas / nMeses;
    const taxaEconomia = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;
    const comprometimento = totalReceitas > 0 ? (totalDespesas / totalReceitas) * 100 : 0;
    const mesesReserva = despesaMediaMensal > 0 ? reserva / despesaMediaMensal : 0;
    const recorrentesMes = totalMensalParcelas + totalMensalAssinaturas;
    const pesoRecorrentes = totalReceitas > 0 ? (recorrentesMes / totalReceitas) * 100 : 0;

    const sEconomia = Math.max(0, Math.min(35, (taxaEconomia / 100) * 35));
    const sCompr = Math.max(0, Math.min(30, ((100 - comprometimento) / 100) * 30));
    const sReserva = Math.max(0, Math.min(20, (mesesReserva / 6) * 20));
    const sInvest = totalInvestido > 0 ? 10 : 0;
    const sRec = pesoRecorrentes <= 30 ? 5 : pesoRecorrentes <= 50 ? 3 : 0;
    return Math.max(0, Math.min(100, Math.round(sEconomia + sCompr + sReserva + sInvest + sRec)));
  }, [transactions, totalReceitas, totalDespesas, saldo, totalMensalParcelas, totalMensalAssinaturas, totalInvestidoStore, patrimonioAtual]);

  const semDados = transactions.length === 0;
  const classificacao = classify(score);
  const handleOpen = () => navigate("/saude-financeira");

  // Geometria do arco semicircular
  const radius = 60;
  const circ = Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="text-left w-full rounded-[var(--radius)] p-4 sm:p-6 md:p-7 h-full relative overflow-hidden bg-gradient-portfolio border border-primary/30 shadow-card focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/20 via-transparent to-accent/30 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-glow/30 blur-3xl pointer-events-none" />

      <div className="relative flex items-center justify-between mb-8 -mt-1">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-4 h-4 text-foreground/80" />
          <h3 className="text-sm font-semibold">Saúde Financeira</h3>
        </div>
        <span
          aria-hidden
          className="w-7 h-7 rounded-full bg-foreground/10 backdrop-blur flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </span>
      </div>

      {semDados ? (
        <div className="relative mt-6">
          <p className="text-2xl font-bold tracking-tight">Sem dados suficientes</p>
          <p className="text-xs text-foreground/70 mt-2 max-w-[80%]">
            Adicione movimentações para calcular sua saúde financeira
          </p>
        </div>
      ) : (
        <>
          <div className="relative flex items-end gap-4 mt-2">
            <div>
              <p className="text-3xl font-bold tracking-tight tabular-nums">
                {score}
                <span className="text-base font-medium text-foreground/60">/100</span>
              </p>
              <p className="text-xs text-foreground/70 mt-1">{classificacao}</p>
            </div>
          </div>

          <p className="relative text-[13px] sm:text-[11px] text-foreground/60 mt-3 w-full max-w-full sm:max-w-[75%] pr-[120px] sm:pr-0 leading-[1.45] [overflow-wrap:break-word] [word-break:break-word] overflow-hidden">
            {resumoPorClass[classificacao]}
          </p>

          {/* Arco semicircular */}
          <svg
            className="absolute bottom-2 right-3 w-[150px] h-[80px]"
            viewBox="0 0 150 80"
            aria-hidden
          >
            <defs>
              <linearGradient id="healthGrad" x1="0" x2="1">
                <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
                <stop offset="100%" stopColor="hsl(var(--success))" />
              </linearGradient>
            </defs>
            <path
              d="M 15 70 A 60 60 0 0 1 135 70"
              fill="none"
              stroke="hsl(var(--foreground) / 0.12)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 15 70 A 60 60 0 0 1 135 70"
              fill="none"
              stroke="url(#healthGrad)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 700ms ease" }}
            />
          </svg>
        </>
      )}
    </button>
  );
};
