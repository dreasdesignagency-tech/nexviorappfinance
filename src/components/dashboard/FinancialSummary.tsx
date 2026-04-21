import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  receitas: number;
  despesas: number;
}

export const FinancialSummary = ({ receitas, despesas }: Props) => {
  const saldo = receitas - despesas;

  const items = [
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <div key={it.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground">
                {it.label}
              </p>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${it.bg}`}>
                <Icon className={`w-4 h-4 ${it.tone}`} />
              </div>
            </div>
            <p className="text-2xl font-bold mt-3 tabular-nums">{fmt(it.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{it.diff}</p>
          </div>
        );
      })}
    </div>
  );
};
