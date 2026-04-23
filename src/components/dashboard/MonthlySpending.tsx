import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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

  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const t of transactions) {
      const y = Number(t.data.split("-")[0]);
      if (!Number.isNaN(y)) set.add(y);
    }
    set.add(currentYear);
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, currentYear]);

  const [year, setYear] = useState<number>(currentYear);

  // Janela rolante: últimos 5 meses até o mês atual (ou DEZ se for ano passado)
  const windowMonths = useMemo(() => {
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();
    const endMonth = isCurrentYear ? now.getMonth() : 11; // 0-11
    const months: { idx: number; label: string; year: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      let m = endMonth - i;
      let y = year;
      if (m < 0) {
        m += 12;
        y -= 1;
      }
      months.push({ idx: m, label: MONTHS_SHORT[m], year: y });
    }
    return months;
  }, [year]);

  // Totaliza despesas por (ano, mês)
  const totalsByKey = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.tipo !== "despesa") continue;
      const [y, m] = t.data.split("-").map(Number);
      const key = `${y}-${m - 1}`;
      map.set(key, (map.get(key) ?? 0) + t.valor);
    }
    return map;
  }, [transactions]);

  const windowData = windowMonths.map(({ idx, label, year: y }) => ({
    label,
    value: totalsByKey.get(`${y}-${idx}`) ?? 0,
  }));

  const max = Math.max(...windowData.map((d) => d.value), 0);
  // Índice do mês atual dentro da janela (sempre o último)
  const currentIdx = windowData.length - 1;
  const currentValue = windowData[currentIdx]?.value ?? 0;
  const currentPct = max > 0 ? Math.round((currentValue / max) * 100) : 0;

  // Trigger de animação ao montar / mudar dados
  const [animateKey, setAnimateKey] = useState(0);
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, [animateKey, year, transactions.length]);

  useEffect(() => {
    setAnimateKey((k) => k + 1);
  }, []);

  return (
    <div className="glass-card p-4 sm:p-6 md:p-7 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 md:mb-8 gap-3">
        <h3 className="text-sm font-semibold">Gastos mensais</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="glass-inner px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition border border-border/50">
            {year} <ChevronDown className="w-3 h-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableYears.map((y) => (
              <DropdownMenuItem key={y} onClick={() => setYear(y)}>
                {y}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-1 min-h-[160px] pt-6 md:pt-8 overflow-hidden">
        {windowData.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const isCurrent = i === currentIdx;
          const isHighlighted = isCurrent && d.value > 0;
          // Altura final: mín 8% para barras vazias (estado elegante), mín 12% para barras com valor
          const targetHeight = max > 0
            ? Math.max(pct, d.value > 0 ? 12 : 8)
            : 8;
          const renderHeight = animated ? targetHeight : 0;

          return (
            <div
              key={`${d.label}-${animateKey}`}
              className="flex flex-col items-center gap-2.5 md:gap-3 flex-1 min-w-0 group"
              title={`${d.label} · ${formatFull(d.value)}`}
            >
              <div className="relative w-full flex items-end justify-center" style={{ height: 140 }}>
                {isHighlighted && (
                  <span
                    className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-[0_4px_12px_hsl(var(--primary)/0.4)] transition-opacity duration-500"
                    style={{ opacity: animated ? 1 : 0 }}
                  >
                    {currentPct}%
                  </span>
                )}
                <div
                  className={`w-full max-w-[38px] rounded-full transition-all duration-700 ease-out ${
                    isHighlighted
                      ? "bg-gradient-to-t from-primary to-primary-glow shadow-[0_0_24px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_32px_hsl(var(--primary)/0.7)]"
                      : d.value > 0
                      ? "bg-gradient-to-t from-primary/30 to-primary/15 border border-primary/20 group-hover:from-primary/45 group-hover:to-primary/25 group-hover:shadow-[0_0_18px_hsl(var(--primary)/0.35)]"
                      : "bg-surface-elevated/40 border border-border/30 group-hover:bg-surface-elevated/60"
                  }`}
                  style={{
                    height: `${renderHeight}%`,
                    transitionDelay: `${i * 80}ms`,
                  }}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground tracking-[0.15em]">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
