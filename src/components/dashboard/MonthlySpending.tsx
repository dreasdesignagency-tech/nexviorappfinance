import { useMemo, useState } from "react";
import { ChevronDown, ArrowUpRight, ArrowDownRight, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTransactions } from "@/store/transactions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MONTHS_SHORT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const formatCompact = (v: number) => {
  if (v >= 1000) {
    const k = v / 1000;
    return `R$ ${k.toFixed(k >= 10 ? 0 : 1).replace(".", ",")}k`;
  }
  return `R$ ${v.toFixed(0)}`;
};

const formatFull = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const MonthlySpending = () => {
  const { transactions } = useTransactions();

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    const now = new Date();
    set.add(`${now.getFullYear()}-${now.getMonth()}`);
    for (const t of transactions) {
      const [y, m] = t.data.split("-").map(Number);
      if (!Number.isNaN(y) && !Number.isNaN(m)) {
        set.add(`${y}-${m - 1}`);
      }
    }
    return Array.from(set)
      .map((k) => {
        const [y, m] = k.split("-").map(Number);
        return { year: y, month: m };
      })
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [transactions]);

  const [selected, setSelected] = useState<{ year: number; month: number }>(
    availableMonths[0] ?? { year: new Date().getFullYear(), month: new Date().getMonth() }
  );

  const windowData = useMemo(() => {
    const arr: { label: string; value: number; year: number; month: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(selected.year, selected.month - i, 1);
      arr.push({
        label: MONTHS_SHORT[d.getMonth()],
        year: d.getFullYear(),
        month: d.getMonth(),
        value: 0,
      });
    }
    for (const t of transactions) {
      if (t.tipo !== "despesa") continue;
      const [y, m] = t.data.split("-").map(Number);
      const idx = arr.findIndex((a) => a.year === y && a.month === m - 1);
      if (idx >= 0) arr[idx].value += t.valor;
    }
    return arr;
  }, [transactions, selected]);

  // Top categoria do mês selecionado
  const topCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.tipo !== "despesa") continue;
      const [y, m] = t.data.split("-").map(Number);
      if (y === selected.year && m - 1 === selected.month) {
        map.set(t.categoria, (map.get(t.categoria) ?? 0) + t.valor);
      }
    }
    let top: { categoria: string; valor: number } | null = null;
    for (const [categoria, valor] of map) {
      if (!top || valor > top.valor) top = { categoria, valor };
    }
    return top;
  }, [transactions, selected]);

  const currentTotal = windowData[windowData.length - 1]?.value ?? 0;
  const previousTotal = windowData[windowData.length - 2]?.value ?? 0;
  const hasPrev = previousTotal > 0;
  const deltaPct = hasPrev ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  const isUp = deltaPct >= 0;
  const hasData = windowData.some((d) => d.value > 0);
  const maxValue = Math.max(...windowData.map((d) => d.value), 0);
  const maxIdx = windowData.findIndex((d) => d.value === maxValue && d.value > 0);
  const peakMonth = maxIdx >= 0 ? windowData[maxIdx] : null;

  const selectedLabel = `${MONTHS_SHORT[selected.month]} ${selected.year}`;

  const insightText = useMemo(() => {
    if (!hasData) return "Adicione transações para receber insights da nex.ia.";
    const parts: string[] = [];
    if (peakMonth) {
      parts.push(`Pico de gastos em ${peakMonth.label} (${formatCompact(peakMonth.value)})`);
    }
    if (topCategory) {
      parts.push(`puxado por ${topCategory.categoria}`);
    }
    if (hasPrev) {
      parts.push(`${isUp ? "alta" : "queda"} de ${Math.abs(deltaPct).toFixed(0)}% vs mês anterior`);
    }
    return parts.join(" · ") + ".";
  }, [hasData, peakMonth, topCategory, hasPrev, isUp, deltaPct]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="glass-card p-4 sm:p-6 md:p-7 h-full flex flex-col relative overflow-hidden group"
    >
      {/* Glow ambient */}
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-40 pointer-events-none blur-3xl transition-opacity duration-700 group-hover:opacity-60"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)" }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Gastos mensais</h3>
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <motion.span
              key={currentTotal}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              {formatFull(currentTotal)}
            </motion.span>
            {hasPrev && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isUp
                    ? "text-rose-300 border-rose-400/30 bg-rose-500/10 shadow-[0_0_18px_hsl(0_80%_60%/0.25)]"
                    : "text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shadow-[0_0_18px_hsl(150_80%_50%/0.25)]"
                }`}
              >
                {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(deltaPct).toFixed(0)}% vs mês ant.
              </motion.span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="glass-inner shrink-0 px-3 py-1.5 rounded-full text-[11px] flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition border border-border/50">
            {selectedLabel} <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
            {availableMonths.map((m) => (
              <DropdownMenuItem
                key={`${m.year}-${m.month}`}
                onClick={() => setSelected(m)}
              >
                {MONTHS_SHORT[m.month]} {m.year}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chart */}
      <div className="mt-5 flex-1 min-h-[200px] relative">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <ComposedChart data={windowData} margin={{ top: 18, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="msBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="msArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <filter id="msGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid stroke="hsl(var(--border) / 0.25)" vertical={false} strokeDasharray="3 4" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: 1 }}
              />
              <YAxis hide domain={[0, (max: number) => max * 1.25]} />
              <Tooltip
                cursor={{ fill: "hsl(var(--primary) / 0.06)" }}
                contentStyle={{
                  background: "hsl(var(--background) / 0.9)",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 8px 32px hsl(var(--primary) / 0.2)",
                }}
                formatter={(v: number) => [formatFull(v), "Gasto"]}
                labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: 10, letterSpacing: 1 }}
              />
              <Bar
                dataKey="value"
                fill="url(#msBar)"
                radius={[8, 8, 8, 8]}
                barSize={22}
                animationDuration={900}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="none"
                fill="url(#msArea)"
                animationDuration={1100}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                filter="url(#msGlow)"
                dot={{
                  r: 4,
                  fill: "hsl(var(--background))",
                  stroke: "hsl(var(--primary))",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "hsl(var(--primary))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2,
                }}
                animationDuration={1100}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full min-h-[200px] flex items-center justify-center text-xs text-muted-foreground text-center px-4">
            Nenhuma despesa registrada em {selectedLabel}.
          </div>
        )}
      </div>

      {/* Bottom mini cards */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-inner rounded-2xl p-3.5 border border-border/40 hover:border-primary/30 transition group/card relative overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-primary-glow" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground">
              MAIOR GASTO
            </p>
          </div>
          <div className="mt-2">
            {topCategory ? (
              <>
                <p className="text-sm font-semibold truncate">{topCategory.categoria}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFull(topCategory.valor)}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Sem dados no período.</p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-inner rounded-2xl p-3.5 border border-primary/20 relative overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-50 pointer-events-none blur-2xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 70%)" }}
          />
          <div className="flex items-center gap-2 relative">
            <div className="w-7 h-7 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
            </div>
            <p className="text-[10px] font-bold tracking-[0.15em] text-primary-glow">
              NEX.IA · INSIGHT
            </p>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-foreground/90 relative">
            {insightText}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};
