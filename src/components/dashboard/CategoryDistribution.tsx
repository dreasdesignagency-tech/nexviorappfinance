import { useMemo } from "react";
import { formatBRL, useTransactions } from "@/store/transactions";

const PALETTE: Record<string, string> = {
  "Meus Mimos": "hsl(224 95% 64%)",
  "Presentes": "hsl(280 80% 65%)",
  "Alimentação": "hsl(38 92% 60%)",
  "Investimentos": "hsl(142 70% 55%)",
  "Transporte": "hsl(200 80% 60%)",
  "Salário": "hsl(160 70% 50%)",
  "Freelance": "hsl(260 70% 65%)",
  "Outros": "hsl(220 10% 60%)",
};
const colorFor = (name: string) => PALETTE[name] ?? "hsl(220 10% 60%)";

const Donut = ({ data }: { data: { name: string; pct: number }[] }) => {
  const r = 56;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 160 160" className="w-40 h-40 -rotate-90">
      <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth="18" />
      {data.map((d) => {
        const len = (d.pct / 100) * c;
        const el = (
          <circle
            key={d.name}
            cx="80" cy="80" r={r}
            fill="none"
            stroke={colorFor(d.name)}
            strokeWidth="18"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            strokeLinecap="butt"
          />
        );
        offset += len;
        return el;
      })}
    </svg>
  );
};

export const CategoryDistribution = () => {
  const { transactions } = useTransactions();

  const detailed = useMemo(() => {
    const totals = new Map<string, number>();
    let total = 0;
    for (const t of transactions) {
      if (t.tipo !== "despesa") continue;
      totals.set(t.categoria, (totals.get(t.categoria) ?? 0) + t.valor);
      total += t.valor;
    }
    const arr = Array.from(totals.entries())
      .map(([name, value]) => ({
        name,
        value,
        pct: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return arr;
  }, [transactions]);

  const top4 = detailed.slice(0, 4);

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold mb-1">Distribuição</h3>
      <p className="text-xs text-muted-foreground mb-5">Como seus gastos estão divididos</p>

      {detailed.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Sem despesas registradas.</p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              <Donut data={top4} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[10px] text-muted-foreground tracking-wider">TOTAL</span>
                <span className="text-base font-bold">100%</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-2">
              {top4.map((d) => (
                <div key={d.name} className="flex items-center gap-3 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorFor(d.name) }} />
                  <span className="flex-1 text-foreground">{d.name}</span>
                  <span className="text-muted-foreground tabular-nums">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-border/60">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">
              POR CATEGORIA
            </h4>
            <div className="space-y-3">
              {detailed.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: colorFor(d.name) }} />
                      <span>{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-medium">{formatBRL(d.value)}</span>
                      <span className="text-muted-foreground text-xs w-8 text-right">{d.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.pct}%`, background: colorFor(d.name) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
