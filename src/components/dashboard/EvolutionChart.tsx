import { useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { useTransactions } from "@/store/transactions";

const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export const EvolutionChart = () => {
  const { transactions } = useTransactions();

  const data = useMemo(() => {
    const now = new Date();
    const refYear = now.getFullYear();
    const refMonth = now.getMonth() + 1;
    const series: { mes: string; Receitas: number; Despesas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = ((refMonth - 1 - i) % 12 + 12) % 12; // 0-11
      const y = refYear + Math.floor((refMonth - 1 - i) / 12);
      let r = 0, d = 0;
      for (const t of transactions) {
        const [ty, tm] = t.data.split("-").map(Number);
        if (ty === y && tm === m + 1) {
          if (t.tipo === "receita") r += t.valor;
          else d += t.valor;
        }
      }
      series.push({ mes: MESES[m], Receitas: r, Despesas: d });
    }
    return series;
  }, [transactions]);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Evolução Financeira</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Receitas</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive" /> Despesas</span>
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gReceitas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(v: number) =>
                v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
            />
            <Area type="monotone" dataKey="Receitas" stroke="hsl(var(--success))" strokeWidth={2} fill="url(#gReceitas)" />
            <Area type="monotone" dataKey="Despesas" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#gDespesas)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
