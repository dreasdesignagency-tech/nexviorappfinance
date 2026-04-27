import { Sidebar } from "@/components/dashboard/Sidebar";
import { useTransactions, formatBRL } from "@/store/transactions";
import { useRecurrents } from "@/store/recurrents";
import { useCards } from "@/store/cards";
import { useLimits } from "@/store/limits";
import { useMemo } from "react";
import { Wallet, ShieldCheck, AlertTriangle, TrendingUp, Lightbulb, Sparkles } from "lucide-react";

type Classificacao = "Crítica" | "Atenção" | "Boa" | "Excelente";

const classify = (score: number): Classificacao => {
  if (score < 40) return "Crítica";
  if (score < 60) return "Atenção";
  if (score < 80) return "Boa";
  return "Excelente";
};

const classColor: Record<Classificacao, string> = {
  "Crítica": "text-destructive",
  "Atenção": "text-yellow-500",
  "Boa": "text-primary",
  "Excelente": "text-success",
};

const classBg: Record<Classificacao, string> = {
  "Crítica": "bg-destructive/15 border-destructive/30",
  "Atenção": "bg-yellow-500/15 border-yellow-500/30",
  "Boa": "bg-primary/15 border-primary/30",
  "Excelente": "bg-success/15 border-success/30",
};

const SaudeFinanceira = () => {
  const { transactions, totalReceitas, totalDespesas, saldo } = useTransactions();
  const { totalMensalParcelas, totalMensalAssinaturas } = useRecurrents();
  const { cards } = useCards();
  const { totalInvestido: totalInvestidoStore, patrimonioAtual } = useLimits();

  const metricas = useMemo(() => {
    const investidoCategoria = transactions
      .filter((t) => t.categoria === "Investimentos" && t.tipo === "despesa")
      .reduce((s, t) => s + t.valor, 0);
    const totalInvestido = totalInvestidoStore > 0 ? patrimonioAtual : investidoCategoria;

    // Reserva = saldo positivo (excedente)
    const reserva = Math.max(0, saldo);

    // Média de despesas mensais (considera meses únicos das transações)
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

    // SCORE: 0 a 100
    // 35pts taxa economia (0-100% → 0-35), 30pts comprometimento (invertido), 20pts meses reserva (0-6m → 0-20),
    // 10pts investimentos (>0 = +10), 5pts recorrentes (baixo peso = +5)
    const sEconomia = Math.max(0, Math.min(35, (taxaEconomia / 100) * 35));
    const sCompr = Math.max(0, Math.min(30, ((100 - comprometimento) / 100) * 30));
    const sReserva = Math.max(0, Math.min(20, (mesesReserva / 6) * 20));
    const sInvest = totalInvestido > 0 ? 10 : 0;
    const sRec = pesoRecorrentes <= 30 ? 5 : pesoRecorrentes <= 50 ? 3 : 0;
    const score = Math.round(sEconomia + sCompr + sReserva + sInvest + sRec);

    return {
      totalInvestido,
      reserva,
      taxaEconomia,
      comprometimento,
      mesesReserva,
      recorrentesMes,
      pesoRecorrentes,
      score: Math.max(0, Math.min(100, score)),
    };
  }, [transactions, totalReceitas, totalDespesas, saldo, totalMensalParcelas, totalMensalAssinaturas]);

  const classificacao = classify(metricas.score);
  const semDados = transactions.length === 0;

  const insights = useMemo(() => {
    const list: { tipo: "positivo" | "alerta" | "info"; texto: string }[] = [];
    if (metricas.taxaEconomia >= 20) list.push({ tipo: "positivo", texto: "Sua taxa de economia está saudável." });
    else if (metricas.taxaEconomia > 0) list.push({ tipo: "info", texto: "Sua taxa de economia ainda pode melhorar." });
    else list.push({ tipo: "alerta", texto: "Você não está conseguindo poupar no momento." });

    if (metricas.comprometimento >= 80) list.push({ tipo: "alerta", texto: "Seu comprometimento de renda está alto." });
    else if (metricas.comprometimento >= 50) list.push({ tipo: "info", texto: "Seu comprometimento está moderado, fique atento." });
    else list.push({ tipo: "positivo", texto: "Seu nível de comprometimento está sob controle." });

    if (metricas.mesesReserva < 1) list.push({ tipo: "alerta", texto: "Sua reserva ainda cobre poucos meses." });
    else if (metricas.mesesReserva < 6) list.push({ tipo: "info", texto: "Continue construindo sua reserva de emergência." });
    else list.push({ tipo: "positivo", texto: "Você possui uma reserva sólida para imprevistos." });

    if (metricas.totalInvestido > 0) list.push({ tipo: "positivo", texto: "Você já possui uma boa base de investimentos." });
    else list.push({ tipo: "info", texto: "Considere começar a investir parte do seu saldo." });

    if (metricas.pesoRecorrentes >= 40) list.push({ tipo: "alerta", texto: "Seus gastos recorrentes podem estar pressionando seu orçamento." });

    if (cards.length > 3) list.push({ tipo: "info", texto: "Você possui muitos cartões — fique atento ao limite total." });

    if (metricas.score >= 70) list.push({ tipo: "positivo", texto: "Seu perfil financeiro está evoluindo bem." });
    return list;
  }, [metricas, cards.length]);

  // Geometria do arco semicircular
  const radius = 90;
  const circ = Math.PI * radius;
  const offset = circ - (metricas.score / 100) * circ;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden pt-safe">
        <header className="flex items-center justify-between mb-6 gap-4 flex-wrap pl-12 md:pl-0">
          <div>
            <p className="text-sm text-muted-foreground">Visão geral da sua vida financeira</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">Saúde Financeira</h1>
          </div>
        </header>

        {semDados && (
          <div className="glass-card p-4 mb-6 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <p className="text-sm text-muted-foreground">
              Adicione suas movimentações para calcular sua saúde financeira.
            </p>
          </div>
        )}

        {/* Score principal */}
        <section className="glass-card p-8 mb-6 flex flex-col items-center">
          <div className="relative w-[260px] h-[150px]">
            <svg viewBox="0 0 220 130" className="w-full h-full">
              <path
                d="M 20 120 A 90 90 0 0 1 200 120"
                fill="none"
                stroke="hsl(var(--surface-elevated))"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 20 120 A 90 90 0 0 1 200 120"
                fill="none"
                stroke="url(#scoreGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 700ms ease" }}
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--success))" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
              <p className="text-5xl font-bold tabular-nums bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                {metricas.score}
              </p>
              <p className="text-xs text-muted-foreground">de 100</p>
            </div>
          </div>
          <div
            className={`mt-5 px-4 py-1.5 rounded-full border text-sm font-semibold ${classBg[classificacao]} ${classColor[classificacao]}`}
          >
            {classificacao}
          </div>
        </section>

        {/* Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <MetricCard
            icon={<Wallet className="w-5 h-5 text-primary" />}
            title="Taxa de Economia"
            subtitle="Quanto você poupa da renda"
            value={`${metricas.taxaEconomia.toFixed(1)}%`}
          />
          <MetricCard
            icon={<ShieldCheck className="w-5 h-5 text-success" />}
            title="Meses de Reserva"
            subtitle="Meses que suas reservas cobrem"
            value={metricas.mesesReserva.toFixed(1)}
          />
          <MetricCard
            icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />}
            title="Comprometimento"
            subtitle="Renda comprometida com gastos"
            value={`${metricas.comprometimento.toFixed(1)}%`}
          />
          <MetricCard
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            title="Total Investido"
            subtitle="Patrimônio em investimentos"
            value={formatBRL(metricas.totalInvestido)}
          />
        </section>

        {/* Insights */}
        <section className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Insights</h2>
          </div>
          <ul className="space-y-2.5">
            {insights.map((i, idx) => {
              const dot =
                i.tipo === "positivo" ? "bg-success"
                : i.tipo === "alerta" ? "bg-destructive"
                : "bg-primary";
              return (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <span className="text-foreground/90">{i.texto}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
};

const MetricCard = ({
  icon, title, subtitle, value,
}: { icon: React.ReactNode; title: string; subtitle: string; value: string }) => (
  <div className="glass-card p-5">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-surface-elevated/60 border border-border/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <p className="text-2xl font-bold tabular-nums">{value}</p>
  </div>
);

export default SaudeFinanceira;
