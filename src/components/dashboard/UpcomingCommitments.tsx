import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Home, CreditCard, Repeat, Receipt } from "lucide-react";
import { formatBRL, useTransactions } from "@/store/transactions";
import { useCards } from "@/store/cards";
import { useRecurrents } from "@/store/recurrents";

type CommitmentKind = "cartao" | "parcela" | "assinatura" | "recorrente";

interface Commitment {
  id: string;
  kind: CommitmentKind;
  name: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  meta?: string; // e.g. "Mensal", "4/10"
}

const KIND_ICON: Record<CommitmentKind, typeof Home> = {
  cartao: CreditCard,
  parcela: Receipt,
  assinatura: Repeat,
  recorrente: Home,
};

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseISO = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDateLabel = (iso: string) => {
  const dt = parseISO(iso);
  const t = today();
  const diffDays = Math.round((dt.getTime() - t.getTime()) / 86400000);
  if (diffDays === 0) return "vence hoje";
  if (diffDays === 1) return "amanhã";
  if (diffDays > 1 && diffDays <= 6) return `em ${diffDays} dias`;
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
};

// Compute the next due date this month (or next) given a billing day
const nextDueByDay = (day: number): string => {
  const t = today();
  let target = new Date(t.getFullYear(), t.getMonth(), day);
  if (target < t) {
    target = new Date(t.getFullYear(), t.getMonth() + 1, day);
  }
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
};

export const UpcomingCommitments = () => {
  const { cards } = useCards();
  const { parcelas, assinaturas } = useRecurrents();
  const { transactions } = useTransactions();

  const commitments = useMemo<Commitment[]>(() => {
    const items: Commitment[] = [];
    const t = today();
    const horizon = new Date(t);
    horizon.setDate(horizon.getDate() + 30);

    // Cartões: vencimento mensal
    for (const c of cards) {
      if (!c.dia_vencimento) continue;
      const due = nextDueByDay(c.dia_vencimento);
      if (parseISO(due) > horizon) continue;
      items.push({
        id: `card-${c.id}`,
        kind: "cartao",
        name: `Cartão ${c.nome}`,
        date: due,
        amount: c.limite ?? 0,
        meta: c.banco,
      });
    }

    // Parcelas em andamento
    for (const p of parcelas) {
      if (p.status !== "Em andamento") continue;
      const due = parseISO(p.proxima_cobranca);
      if (due < t || due > horizon) continue;
      items.push({
        id: `parc-${p.id}`,
        kind: "parcela",
        name: p.nome,
        date: p.proxima_cobranca,
        amount: p.valor_parcela,
        meta: `${p.parcela_atual}/${p.total_parcelas}`,
      });
    }

    // Assinaturas ativas
    for (const a of assinaturas) {
      if (a.status !== "ativa") continue;
      const due = parseISO(a.data_cobranca);
      if (due < t || due > horizon) continue;
      items.push({
        id: `ass-${a.id}`,
        kind: "assinatura",
        name: a.nome,
        date: a.data_cobranca,
        amount: a.valor,
        meta: a.frequencia === "mensal" ? "Mensal" : "Anual",
      });
    }

    // Despesas marcadas como recorrentes
    for (const tx of transactions) {
      if (!tx.recorrente || tx.tipo !== "despesa") continue;
      const due = parseISO(tx.data);
      if (due < t || due > horizon) continue;
      items.push({
        id: `tx-${tx.id}`,
        kind: "recorrente",
        name: tx.titulo,
        date: tx.data,
        amount: tx.valor,
        meta: tx.categoria,
      });
    }

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [cards, parcelas, assinaturas, transactions]);

  const visible = commitments.slice(0, 4);
  const hasAnyData =
    cards.length + parcelas.length + assinaturas.length + transactions.length > 0;

  const insight = useMemo(() => {
    if (commitments.length === 0) return null;
    const t = today();
    const soon = commitments.filter((c) => {
      const diff = (parseISO(c.date).getTime() - t.getTime()) / 86400000;
      return diff <= 7;
    });
    if (soon.length >= 2) {
      return `Você tem ${soon.length} compromissos vencendo em breve`;
    }
    const biggest = [...commitments].sort((a, b) => b.amount - a.amount)[0];
    if (biggest) {
      return `Seu maior compromisso é ${biggest.name}`;
    }
    return `${commitments.length} compromisso${commitments.length > 1 ? "s" : ""} próximo${commitments.length > 1 ? "s" : ""}`;
  }, [commitments]);

  return (
    <div className="glass-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Próximos compromissos</h3>
        <Link
          to="/recorrentes"
          className="text-xs text-muted-foreground hover:text-foreground glass-inner px-3 py-1 rounded-full"
        >
          Visualizar tudo
        </Link>
      </div>

      {insight && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-[11px] text-foreground/85 truncate">
            <span className="font-semibold text-primary">nex.ia</span>
            <span className="text-muted-foreground"> · </span>
            {insight}
          </p>
        </div>
      )}

      {commitments.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-muted-foreground">
            {hasAnyData
              ? "Sem compromissos financeiros para os próximos dias."
              : "Adicione cartões, parcelas ou assinaturas para visualizar seus próximos compromissos."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((c) => {
            const Icon = KIND_ICON[c.kind];
            const dateLabel = formatDateLabel(c.date);
            const isUrgent = dateLabel === "vence hoje" || dateLabel === "amanhã";
            return (
              <div
                key={c.id}
                className="glass-inner flex items-center gap-3 px-3 py-2.5 hover:bg-surface-elevated/80 transition"
              >
                <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border/60 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isUrgent ? (
                      <span className="text-[10px] bg-primary/20 text-primary-glow px-2 py-0.5 rounded-full font-medium">
                        • {dateLabel}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">{dateLabel}</span>
                    )}
                    {c.meta && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        · {c.meta}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0">
                  {formatBRL(c.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
