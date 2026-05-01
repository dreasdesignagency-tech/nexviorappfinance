import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles, Wallet } from "lucide-react";
import { useTransactions, formatBRL } from "@/store/transactions";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Janela de 6 meses terminando no mês atual
const buildMonths = () => {
  const now = new Date();
  const arr: { label: string; month: number; year: number; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    arr.push({
      label: MONTH_LABELS[d.getMonth()],
      month: d.getMonth(),
      year: d.getFullYear(),
      key: `${d.getFullYear()}-${d.getMonth()}`,
    });
  }
  return arr;
};

export const NetWorthCard = () => {
  const { transactions } = useTransactions();
  const MONTHS = useMemo(() => buildMonths(), []);
  const [activeKey, setActiveKey] = useState(MONTHS[MONTHS.length - 1].key);

  const { receitas, despesas, saldo, patrimonio } = useMemo(() => {
    const active = MONTHS.find((x) => x.key === activeKey) ?? MONTHS[MONTHS.length - 1];
    let r = 0,
      d = 0,
      rAll = 0,
      dAll = 0;
    for (const t of transactions) {
      const [y, mo] = t.data.split("-").map(Number);
      if (t.tipo === "receita") rAll += t.valor;
      else dAll += t.valor;
      if (mo - 1 === active.month && y === active.year) {
        if (t.tipo === "receita") r += t.valor;
        else d += t.valor;
      }
    }
    return { receitas: r, despesas: d, saldo: r - d, patrimonio: rAll - dAll };
  }, [transactions, activeKey, MONTHS]);

  const metrics = [
    {
      label: "RECEITAS",
      value: receitas,
      diff: "0.0% vs mês anterior",
      icon: ArrowUpRight,
      tone: "text-success",
      bg: "bg-success/15 border-success/20",
    },
    {
      label: "DESPESAS",
      value: despesas,
      diff: "0.0% vs mês anterior",
      icon: ArrowDownRight,
      tone: "text-destructive",
      bg: "bg-destructive/15 border-destructive/20",
    },
    {
      label: "SALDO",
      value: saldo,
      diff: "Receitas − Despesas",
      icon: Wallet,
      tone: "text-primary-glow",
      bg: "bg-primary/15 border-primary/20",
    },
  ];

  return (
    <div className="glass-card p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative blob */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-30 pointer-events-none"
        style={{ background: "var(--gradient-blob)" }}
      />

      {/* Badge */}
      <div className="flex items-center justify-between mb-5 relative">
        <span className="inline-block text-[10px] font-bold tracking-[0.15em] text-muted-foreground glass-inner px-3 py-1 rounded-full">
          VISÃO GERAL
        </span>
      </div>

      {/* TOPO — Insight nex.ia */}
      <div className="relative flex items-start gap-3 pb-5 border-b border-border/40">
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-glow" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold tracking-[0.15em] text-primary-glow">
            NEX IA · INSIGHT DO MÊS
          </p>
          <p className="text-sm md:text-sm text-foreground mt-1 leading-relaxed pr-1">
            Adicione transações para receber insights personalizados da{" "}
            <span className="font-semibold">nex.ia</span>!
          </p>
        </div>
      </div>

      {/* MEIO — Seletor de meses */}
      <div className="relative py-5 flex justify-start overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="glass-inner p-1.5 inline-flex items-center gap-1 rounded-full flex-nowrap min-w-max">
          {MONTHS.map(({ label, key }) => {
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BASE — Patrimônio + Métricas */}
      <div className="relative pt-5 border-t border-border/40">
        {/* Patrimônio */}
        <div className="mb-6 md:mb-5">
          <p className="text-sm text-muted-foreground mb-2">Saldo Líquido</p>
          <h2 className="text-[1.9rem] leading-tight sm:text-4xl md:text-5xl font-extrabold tracking-tight break-words max-w-full">
            {formatBRL(patrimonio)}
          </h2>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-3 w-full">
          {metrics.map((it) => {
            const Icon = it.icon;
            return (
              <div
                key={it.label}
                className="glass-inner rounded-2xl p-4 md:p-4 min-w-0 w-full box-border"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground truncate">
                    {it.label}
                  </p>
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${it.bg}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${it.tone}`} />
                  </div>
                </div>
                <p className="text-lg md:text-lg font-bold mt-2 tabular-nums break-words leading-snug">
                  {formatBRL(it.value)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed break-words">
                  {it.diff}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
