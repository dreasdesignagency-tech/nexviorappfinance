import { useMemo, useState } from "react";
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

  // Lista de meses disponíveis (ano-mês) com base nas transações + mês atual
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

  // Janela: 5 meses terminando no mês selecionado
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

  const max = Math.max(...windowData.map((d) => d.value), 0);
  const currentMonthTotal = windowData[windowData.length - 1]?.value ?? 0;
  const hasData = max > 0;
  const maxIdx = windowData.findIndex((d) => d.value === max && d.value > 0);

  const selectedLabel = `${MONTHS_SHORT[selected.month]} ${selected.year}`;

  return (
    <div className="glass-card p-4 sm:p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-semibold">Gastos mensais</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="glass-inner px-3.5 py-1.5 rounded-full text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition border border-border/50">
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

      {hasData ? (
        <div className="flex-1 flex items-end justify-between gap-2 md:gap-3 px-1 min-h-[160px] pt-4 md:pt-6 overflow-hidden">
          {windowData.map((d, i) => {
            const pct = max > 0 ? (d.value / max) * 100 : 0;
            const isMax = i === maxIdx;
            return (
              <div
                key={`${d.year}-${d.month}`}
                className="flex flex-col items-center gap-2.5 md:gap-3 flex-1 min-w-0 group"
                title={`${d.label}/${d.year} · ${formatFull(d.value)}`}
              >
                <div className="relative w-full flex items-end justify-center" style={{ height: 140 }}>
                  {isMax && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shadow-[0_4px_12px_hsl(var(--primary)/0.4)]">
                      {formatCompact(d.value)}
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[38px] rounded-full transition-all ${
                      isMax
                        ? "bg-gradient-to-t from-primary to-primary-glow shadow-[0_0_24px_hsl(var(--primary)/0.5)]"
                        : d.value > 0
                        ? "bg-primary/15 border border-primary/20 group-hover:bg-primary/25"
                        : "bg-surface-elevated/40 border border-border/30"
                    }`}
                    style={{ height: `${Math.max(pct, d.value > 0 ? 10 : 6)}%` }}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground tracking-[0.15em]">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center min-h-[160px] text-xs text-muted-foreground text-center px-4">
          Nenhuma despesa registrada em {selectedLabel}.
        </div>
      )}
    </div>
  );
};
