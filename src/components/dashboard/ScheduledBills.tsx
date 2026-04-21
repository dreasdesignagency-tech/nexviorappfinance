const bills = [
  { letter: "A", name: "Aluguel", date: "Vence hoje", freq: "Mensal", amount: "R$ 2.400", due: true },
  { letter: "S", name: "Seguro do Carro", date: "15/02", freq: "Trimestral", amount: "R$ 380" },
  { letter: "A", name: "Academia", date: "28/02", freq: "Anual", amount: "R$ 49" },
];

export const ScheduledBills = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">Contas agendadas</h3>
        <button className="text-xs text-muted-foreground hover:text-foreground glass-inner px-3 py-1 rounded-full">
          Visualizar tudo
        </button>
      </div>

      <div className="space-y-2">
        {bills.map((b) => (
          <div
            key={b.name}
            className="glass-inner flex items-center gap-4 px-4 py-3 hover:bg-surface-elevated/80 transition"
          >
            <div className="w-9 h-9 rounded-full bg-surface-elevated border border-border/60 flex items-center justify-center text-sm font-semibold shrink-0">
              {b.letter}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{b.name}</p>
              {b.due ? (
                <span className="inline-block mt-0.5 text-[10px] bg-primary/20 text-primary-glow px-2 py-0.5 rounded-full font-medium">
                  • {b.date}
                </span>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-0.5">{b.date}</p>
              )}
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">{b.freq}</span>
            <span className="text-sm font-semibold tabular-nums">{b.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
