import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  CreditCard,
  Repeat,
  Receipt,
  Target,
  TrendingUp,
  Search,
  Sparkles,
} from "lucide-react";
import { formatBRL, useTransactions } from "@/store/transactions";
import { useCards } from "@/store/cards";
import { useRecurrents } from "@/store/recurrents";
import { useLimits } from "@/store/limits";

type ActivityType =
  | "receita"
  | "despesa"
  | "cartao"
  | "parcela"
  | "assinatura"
  | "limite"
  | "investimento"
  | "ia";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  subtitle: string;
  timestamp: string; // ISO datetime
  amount?: number;
  amountSign?: "pos" | "neg";
}

const TYPE_META: Record<
  ActivityType,
  { icon: typeof ArrowUpRight; color: string }
> = {
  receita: { icon: ArrowUpRight, color: "bg-success/15 border-success/25 text-success" },
  despesa: { icon: ArrowDownRight, color: "bg-destructive/15 border-destructive/25 text-destructive" },
  cartao: { icon: CreditCard, color: "bg-primary/15 border-primary/25 text-primary" },
  parcela: { icon: Receipt, color: "bg-accent/15 border-accent/25 text-accent-foreground" },
  assinatura: { icon: Repeat, color: "bg-warning/15 border-warning/25 text-warning" },
  limite: { icon: Target, color: "bg-muted border-border text-muted-foreground" },
  investimento: { icon: TrendingUp, color: "bg-success/15 border-success/25 text-success" },
  ia: { icon: Sparkles, color: "bg-primary/15 border-primary/25 text-primary" },
};

const formatRelative = (iso: string) => {
  const dt = new Date(iso);
  const now = new Date();
  const sameDay =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    dt.getFullYear() === yesterday.getFullYear() &&
    dt.getMonth() === yesterday.getMonth() &&
    dt.getDate() === yesterday.getDate();

  const hhmm = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `hoje às ${hhmm}`;
  if (isYesterday) return `ontem às ${hhmm}`;
  return dt
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
};

export const Activity = () => {
  const { transactions } = useTransactions();
  const { cards } = useCards();
  const { parcelas, assinaturas } = useRecurrents();
  const { limits, investments } = useLimits();
  const [showAll, setShowAll] = useState(false);

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    for (const t of transactions) {
      const isReceita = t.tipo === "receita";
      items.push({
        id: `tx-${t.id}`,
        type: isReceita ? "receita" : "despesa",
        title: isReceita ? "Nova receita" : "Nova despesa",
        subtitle: `${t.titulo} · ${t.categoria}`,
        timestamp: t.created_at,
        amount: t.valor,
        amountSign: isReceita ? "pos" : "neg",
      });
    }

    for (const c of cards) {
      items.push({
        id: `card-${c.id}`,
        type: "cartao",
        title: "Novo cartão cadastrado",
        subtitle: `${c.nome} · ${c.banco}`,
        timestamp: c.created_at,
      });
    }

    for (const p of parcelas) {
      items.push({
        id: `parc-${p.id}`,
        type: "parcela",
        title: "Nova parcela cadastrada",
        subtitle: `${p.nome} · ${p.parcela_atual}/${p.total_parcelas}`,
        timestamp: p.created_at,
        amount: p.valor_parcela,
        amountSign: "neg",
      });
    }

    for (const a of assinaturas) {
      items.push({
        id: `ass-${a.id}`,
        type: "assinatura",
        title: "Nova assinatura",
        subtitle: `${a.nome} · ${a.frequencia}`,
        timestamp: a.created_at,
        amount: a.valor,
        amountSign: "neg",
      });
    }

    for (const l of limits) {
      items.push({
        id: `lim-${l.id}`,
        type: "limite",
        title: "Novo limite criado",
        subtitle: `${l.categoria} · ${l.periodo}`,
        timestamp: l.created_at,
        amount: l.valor_limite,
      });
    }

    for (const i of investments) {
      items.push({
        id: `inv-${i.id}`,
        type: "investimento",
        title: "Novo investimento",
        subtitle: `${i.nome} · ${i.tipo}`,
        timestamp: i.created_at,
        amount: i.valor_investido,
      });
    }

    return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [transactions, cards, parcelas, assinaturas, limits, investments]);

  const visible = showAll ? activities : activities.slice(0, 6);

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Atividade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activities.length > 0
              ? `${activities.length} ${activities.length === 1 ? "evento" : "eventos"} no sistema`
              : "Sem eventos recentes"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 rounded-full glass-inner flex items-center justify-center text-muted-foreground"
            aria-label="Buscar"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          {activities.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="px-3 py-1.5 rounded-full glass-inner text-xs hover:text-foreground transition"
            >
              {showAll ? "Ver menos" : "Visualizar tudo"}
            </button>
          )}
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade recente encontrada.
          </p>
          <Link
            to="/transacoes"
            className="inline-block mt-3 text-xs px-3 py-1.5 rounded-full glass-inner text-foreground/80 hover:text-foreground transition"
          >
            Adicionar transação
          </Link>
        </div>
      ) : (
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {visible.map((a) => {
            const meta = TYPE_META[a.type];
            const Icon = meta.icon;
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 py-2.5 px-2 hover:bg-surface-elevated/40 rounded-xl transition"
              >
                <div
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {a.subtitle} · {formatRelative(a.timestamp)}
                  </p>
                </div>
                {a.amount !== undefined && (
                  <span
                    className={`text-sm font-semibold tabular-nums shrink-0 ${
                      a.amountSign === "pos"
                        ? "text-success"
                        : a.amountSign === "neg"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {a.amountSign === "pos" ? "+" : a.amountSign === "neg" ? "-" : ""}
                    {formatBRL(a.amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
