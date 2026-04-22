import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { useTransactions, formatBRL } from "@/store/transactions";
import { useRecurrents } from "@/store/recurrents";
import { useCards } from "@/store/cards";
import { useLimits } from "@/store/limits";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Flame,
  ArrowRight,
} from "lucide-react";

type Classificacao = "Crítica" | "Atenção" | "Boa" | "Excelente";

const classify = (score: number): Classificacao => {
  if (score < 40) return "Crítica";
  if (score < 60) return "Atenção";
  if (score < 80) return "Boa";
  return "Excelente";
};

const classColor: Record<Classificacao, string> = {
  "Crítica": "text-destructive",
  "Atenção": "text-warning",
  "Boa": "text-primary",
  "Excelente": "text-success",
};

const classBg: Record<Classificacao, string> = {
  "Crítica": "bg-destructive/15 border-destructive/30",
  "Atenção": "bg-warning/15 border-warning/30",
  "Boa": "bg-primary/15 border-primary/30",
  "Excelente": "bg-success/15 border-success/30",
};

const classMessage: Record<Classificacao, string> = {
  "Crítica": "Você está com uma saúde financeira crítica",
  "Atenção": "Você está com uma saúde financeira em atenção",
  "Boa": "Você está com uma saúde financeira boa",
  "Excelente": "Você está com uma saúde financeira excelente",
};

const classGlow: Record<Classificacao, string> = {
  "Crítica": "shadow-[0_0_45px_hsl(var(--destructive)/0.22)]",
  "Atenção": "shadow-[0_0_45px_hsl(var(--warning)/0.2)]",
  "Boa": "shadow-[0_0_45px_hsl(var(--primary)/0.2)]",
  "Excelente": "shadow-[0_0_55px_hsl(var(--success)/0.22)]",
};

const SaudeFinanceira = () => {
  const navigate = useNavigate();
  const { transactions, totalReceitas, totalDespesas, saldo } = useTransactions();
  const { totalMensalParcelas, totalMensalAssinaturas } = useRecurrents();
  const { cards } = useCards();
  const { totalInvestido: totalInvestidoStore, patrimonioAtual } = useLimits();
  const [animatedScore, setAnimatedScore] = useState(0);

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
    const list: { tipo: "positivo" | "alerta" | "info"; texto: string; destaque?: boolean }[] = [];
    if (metricas.taxaEconomia >= 20) list.push({ tipo: "positivo", texto: "Você tem uma taxa de economia acima da média.", destaque: true });
    else if (metricas.taxaEconomia > 0) list.push({ tipo: "info", texto: "Sua taxa de economia está positiva, mas ainda pode subir mais." , destaque: true});
    else list.push({ tipo: "alerta", texto: "Você não está conseguindo poupar no momento e isso reduz seu score.", destaque: true });

    if (metricas.comprometimento >= 80) list.push({ tipo: "alerta", texto: "Seu comprometimento de renda está alto e merece ajuste imediato." });
    else if (metricas.comprometimento >= 50) list.push({ tipo: "info", texto: "Seu comprometimento está moderado; reduzir excessos vai melhorar seu fôlego." });
    else list.push({ tipo: "positivo", texto: "Seus gastos estão sob controle em relação à sua renda." });

    if (metricas.mesesReserva < 1) list.push({ tipo: "alerta", texto: "Sua reserva ainda cobre poucos meses; fortalecer esse colchão é prioridade." });
    else if (metricas.mesesReserva < 6) list.push({ tipo: "info", texto: "Sua reserva está em construção e já mostra boa evolução." });
    else list.push({ tipo: "positivo", texto: "Você possui uma reserva sólida para lidar com imprevistos." });

    if (metricas.totalInvestido > 0) list.push({ tipo: "positivo", texto: "Você já criou uma base patrimonial e isso fortalece sua saúde financeira." });
    else list.push({ tipo: "info", texto: "Começar a investir parte do seu saldo pode acelerar sua evolução financeira." });

    if (metricas.pesoRecorrentes >= 40) list.push({ tipo: "alerta", texto: "Seus gastos recorrentes podem estar pressionando seu orçamento mensal." });
    if (cards.length > 3) list.push({ tipo: "info", texto: "Você possui muitos cartões; revisar limites pode reduzir dispersão e risco." });
    if (metricas.score >= 70) list.push({ tipo: "positivo", texto: "Seu perfil financeiro está evoluindo bem e mostra consistência." });

    return list;
  }, [metricas, cards.length]);

  const smartSummary = useMemo(() => {
    if (semDados) return "Adicione movimentações para gerar uma leitura inteligente e acompanhar sua evolução com mais precisão.";
    if (metricas.score >= 80) return "Seu nível de economia está acima da média e seus gastos estão sob controle.";
    if (metricas.score >= 60) return "Sua base financeira é boa, mas ainda há espaço para fortalecer reserva e investimentos.";
    if (metricas.score >= 40) return "Seu cenário pede ajustes em economia e previsibilidade para ganhar estabilidade.";
    return "Seus indicadores mostram pressão no orçamento; organizar gastos e criar reserva deve ser a prioridade agora.";
  }, [metricas.score, semDados]);

  const primaryAction = useMemo(() => {
    if (metricas.comprometimento >= 80 || metricas.taxaEconomia <= 0) {
      return { label: "Melhorar minha saúde financeira", action: () => navigate("/transacoes") };
    }
    if (metricas.totalInvestido <= 0) {
      return { label: "Melhorar minha saúde financeira", action: () => navigate("/limites-investimentos") };
    }
    return { label: "Melhorar minha saúde financeira", action: () => navigate("/recorrentes") };
  }, [metricas.comprometimento, metricas.taxaEconomia, metricas.totalInvestido, navigate]);

  useEffect(() => {
    let frame = 0;
    const duration = 900;
    const start = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(metricas.score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    setAnimatedScore(0);
    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [metricas.score]);

  const metricCards = [
    {
      icon: <Wallet className="w-5 h-5 text-primary" />,
      title: "Taxa de Economia",
      subtitle: "Quanto você poupa da renda",
      value: `${metricas.taxaEconomia.toFixed(1)}%`,
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-success" />,
      title: "Meses de Reserva",
      subtitle: "Meses que suas reservas cobrem",
      value: metricas.mesesReserva.toFixed(1),
    },
    {
      icon: <AlertTriangle className="w-5 h-5 text-warning" />,
      title: "Comprometimento",
      subtitle: "Renda comprometida com gastos",
      value: `${metricas.comprometimento.toFixed(1)}%`,
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      title: "Total Investido",
      subtitle: "Patrimônio em investimentos",
      value: formatBRL(metricas.totalInvestido),
      isEmpty: metricas.totalInvestido <= 0,
      emptyTitle: "Você ainda não começou",
      emptySuggestion: "Comece a investir para melhorar sua saúde financeira",
    },
  ];

  // Geometria do arco semicircular
  const radius = 90;
  const circ = Math.PI * radius;
  const offset = circ - (metricas.score / 100) * circ;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-8 max-w-[1500px] mx-auto w-full overflow-x-hidden">
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
        <section className="glass-card health-hero-panel health-section-enter p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="absolute -top-24 right-0 w-60 h-60 rounded-full bg-gradient-blob opacity-35 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col items-center text-center">
            <div className="relative w-[260px] h-[150px] md:w-[300px] md:h-[170px]">
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
              <div className={`rounded-full px-6 py-2 backdrop-blur-sm ${classGlow[classificacao]}`}>
                <p className="text-5xl md:text-6xl font-extrabold tabular-nums bg-gradient-to-r from-primary to-success bg-clip-text text-transparent">
                  {animatedScore}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">de 100</p>
            </div>
          </div>

            <div
              className={`mt-5 px-4 py-1.5 rounded-full border text-sm font-semibold ${classBg[classificacao]} ${classColor[classificacao]}`}
            >
              {classificacao}
            </div>

            <div className="max-w-2xl mt-5 space-y-3">
              <p className={`text-lg md:text-xl font-semibold ${classColor[classificacao]}`}>
                {classMessage[classificacao]}
              </p>
              <p className="text-sm md:text-base text-foreground/85 leading-relaxed">
                {smartSummary}
              </p>
            </div>
          </div>
        </section>

        {/* Métricas */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {metricCards.map((card, index) => (
            <MetricCard key={card.title} {...card} index={index} />
          ))}
        </section>

        {/* Insights */}
        <section className="glass-card health-section-enter p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8 pointer-events-none" />
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Insights</h2>
          </div>

          {insights[0] && (
            <div className="relative mb-4 rounded-[calc(var(--radius)-6px)] border border-primary/25 bg-gradient-to-r from-primary/15 via-primary/10 to-accent/15 p-4 shadow-[0_0_35px_hsl(var(--primary)/0.14)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent translate-x-[-100%] animate-[shine_3.6s_ease-in-out_infinite]" />
              <div className="relative flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-primary-glow" />
                </div>
                <div>
                  <p className="text-xs font-bold tracking-[0.14em] text-primary-glow mb-1">DESTAQUE</p>
                  <p className="text-sm md:text-base font-medium text-foreground/95">{insights[0].texto}</p>
                </div>
              </div>
            </div>
          )}

          <ul className="space-y-3 relative">
            {insights.slice(1).map((i, idx) => {
              const Icon = i.tipo === "positivo" ? CheckCircle2 : i.tipo === "alerta" ? AlertTriangle : Sparkles;
              const cardTone =
                i.tipo === "positivo"
                  ? "border-success/20 bg-success/10 text-success"
                  : i.tipo === "alerta"
                    ? "border-warning/20 bg-warning/10 text-warning"
                    : "border-primary/20 bg-primary/10 text-primary";
              return (
                <li
                  key={`${i.texto}-${idx}`}
                  className="health-stagger-in glass-inner rounded-2xl p-4 flex items-start gap-3 text-sm border border-border/40"
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  <span className={`mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${cardTone}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-foreground/90 leading-relaxed">{i.texto}</span>
                </li>
              );
            })}
          </ul>

          <div className="relative mt-6 flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={primaryAction.action}
              className="premium-cta h-11 px-5 bg-gradient-primary text-primary-foreground shadow-glow hover:scale-[1.02]"
            >
              {primaryAction.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/nex-ia")}
              className="premium-cta h-11 px-5 border-primary/25 bg-surface-elevated/50 hover:bg-primary/10 hover:text-foreground"
            >
              Ver recomendações
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

const MetricCard = ({
  icon, title, subtitle, value, index, isEmpty, emptyTitle, emptySuggestion,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  index: number;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptySuggestion?: string;
}) => (
  <div className="glass-card premium-metric-card health-stagger-in p-5 md:p-6 relative" style={{ animationDelay: `${index * 100}ms` }}>
    <div className="flex items-center gap-3 mb-4 relative z-10">
      <div className="w-11 h-11 rounded-2xl bg-surface-elevated/60 border border-border/50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>

    {isEmpty ? (
      <div className="relative z-10">
        <p className="text-xl font-bold text-foreground">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{emptySuggestion}</p>
      </div>
    ) : (
      <p className="relative z-10 text-2xl md:text-[1.75rem] font-bold tabular-nums leading-tight">{value}</p>
    )}
  </div>
);

export default SaudeFinanceira;
