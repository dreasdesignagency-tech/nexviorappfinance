import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatBRL, formatDateShort, useTransactions } from "@/store/transactions";

export const RecentTransactions = () => {
  const { transactions } = useTransactions();
  const recent = [...transactions]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 5);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold">Transações Recentes</h3>
        <Link
          to="/transacoes"
          className="text-xs px-3 py-1.5 rounded-full glass-inner text-muted-foreground hover:text-foreground transition"
        >
          Ver todas
        </Link>
      </div>

      <div className="space-y-1">
        {recent.map((t) => {
          const isReceita = t.tipo === "receita";
          const Icon = isReceita ? ArrowUpRight : ArrowDownRight;
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 py-2.5 px-2 hover:bg-surface-elevated/40 rounded-xl transition"
            >
              <div
                className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                  isReceita
                    ? "bg-success/15 border-success/25 text-success"
                    : "bg-destructive/15 border-destructive/25 text-destructive"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{t.titulo}</p>
                <p className="text-[11px] text-muted-foreground">
                  {t.categoria} · {formatDateShort(t.data)}
                </p>
              </div>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isReceita ? "text-success" : "text-destructive"
                }`}
              >
                {isReceita ? "+" : "-"}
                {formatBRL(t.valor)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
