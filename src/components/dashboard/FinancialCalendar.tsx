import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTransactions, formatBRL } from "@/store/transactions";
import { useCards } from "@/store/cards";
import { useRecurrents } from "@/store/recurrents";

type EventType = "receita" | "despesa" | "cartao" | "parcela" | "assinatura";

interface CalEvent {
  type: EventType;
  label: string;
  value?: number;
}

const TYPE_STYLES: Record<EventType, { dot: string; text: string; name: string }> = {
  receita: { dot: "bg-success", text: "text-success", name: "Receita" },
  despesa: { dot: "bg-destructive", text: "text-destructive", name: "Despesa" },
  cartao: { dot: "bg-primary", text: "text-primary-glow", name: "Cartão" },
  parcela: { dot: "bg-[hsl(270_80%_65%)]", text: "text-[hsl(270_90%_75%)]", name: "Parcela" },
  assinatura: { dot: "bg-warning", text: "text-warning", name: "Assinatura" },
};

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const FinancialCalendar = () => {
  const { transactions } = useTransactions();
  const { cards } = useCards();
  const { parcelas, assinaturas } = useRecurrents();

  const [cursor, setCursor] = useState(() => new Date(2026, 3, 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth() + 1; // 1-12

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalEvent[]> = {};
    const push = (day: number, ev: CalEvent) => {
      if (day < 1 || day > 31) return;
      (map[day] ||= []).push(ev);
    };

    // Transações
    for (const t of transactions) {
      const [y, m, d] = t.data.split("-").map(Number);
      if (y === year && m === month) {
        push(d, { type: t.tipo, label: t.titulo, value: t.valor });
      }
    }

    // Cartões — vencimento
    for (const c of cards) {
      if (c.dia_vencimento) {
        push(c.dia_vencimento, { type: "cartao", label: `Vencimento ${c.nome}` });
      }
    }

    // Parcelas
    for (const p of parcelas) {
      if (!p.proxima_cobranca) continue;
      const [y, m, d] = p.proxima_cobranca.split("-").map(Number);
      if (y === year && m === month) {
        push(d, { type: "parcela", label: `${p.nome} (${p.parcela_atual}/${p.total_parcelas})`, value: p.valor_parcela });
      }
    }

    // Assinaturas
    for (const a of assinaturas) {
      if (a.status !== "ativa" || !a.data_cobranca) continue;
      const [y, m, d] = a.data_cobranca.split("-").map(Number);
      if (y === year && m === month) {
        push(d, { type: "assinatura", label: a.nome, value: a.valor });
      }
    }

    return map;
  }, [transactions, cards, parcelas, assinaturas, year, month]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const goPrev = () => {
    setCursor(new Date(year, month - 2, 1));
    setSelectedDay(null);
  };
  const goNext = () => {
    setCursor(new Date(year, month, 1));
    setSelectedDay(null);
  };

  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];
  const uniqueTypes = (evs: CalEvent[]) => Array.from(new Set(evs.map((e) => e.type)));

  return (
    <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold">Calendário Financeiro</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Seus compromissos do mês</p>
        </div>
        <div className="flex items-center gap-1 glass-inner rounded-full p-1">
          <button
            onClick={goPrev}
            className="w-7 h-7 rounded-full hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium px-2 min-w-[88px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={goNext}
            className="w-7 h-7 rounded-full hover:bg-surface-elevated flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            aria-label="Próximo mês"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-muted-foreground mt-4 mb-4">
        {(Object.keys(TYPE_STYLES) as EventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${TYPE_STYLES[t].dot}`} />
            {TYPE_STYLES[t].name}
          </span>
        ))}
      </div>

      {/* Grade */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-[10px] text-muted-foreground font-semibold py-1">{d}</span>
        ))}
        {cells.map((day, i) => {
          const evs = day ? eventsByDay[day] : undefined;
          const isSelected = day === selectedDay;
          const hasEvents = !!evs?.length;
          return (
            <button
              key={i}
              disabled={!day}
              onClick={() => day && setSelectedDay(day)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative transition ${
                day
                  ? `glass-inner hover:bg-surface-elevated cursor-pointer ${
                      isSelected ? "ring-1 ring-primary/60 bg-primary/10" : ""
                    }`
                  : "opacity-0 pointer-events-none"
              }`}
            >
              {day && (
                <>
                  <span className={`${hasEvents ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {day}
                  </span>
                  {evs && (
                    <div className="flex gap-0.5 absolute bottom-1">
                      {uniqueTypes(evs).slice(0, 4).map((t, idx) => (
                        <span key={idx} className={`w-1 h-1 rounded-full ${TYPE_STYLES[t].dot}`} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Painel do dia selecionado */}
      {selectedDay !== null && (
        <div className="mt-4 glass-inner rounded-2xl p-4 border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold">
              {selectedDay} de {MONTHS[month - 1]}
            </h4>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-muted-foreground hover:text-foreground transition"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum compromisso financeiro neste dia.</p>
          ) : (
            <ul className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {selectedEvents.map((ev, idx) => {
                const s = TYPE_STYLES[ev.type];
                return (
                  <li key={idx} className="flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{ev.label}</p>
                        <p className={`text-[10px] ${s.text}`}>{s.name}</p>
                      </div>
                    </div>
                    {typeof ev.value === "number" && (
                      <span className={`text-xs font-semibold shrink-0 ${ev.type === "receita" ? "text-success" : "text-foreground"}`}>
                        {ev.type === "receita" ? "+" : ev.type === "despesa" ? "-" : ""}{formatBRL(ev.value)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
