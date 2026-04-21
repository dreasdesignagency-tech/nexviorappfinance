interface Props {
  active: string;
  onChange: (m: string) => void;
}

const months = ["Nov", "Dez", "Jan", "Fev", "Mar", "Abr"];

export const PeriodFilter = ({ active, onChange }: Props) => {
  return (
    <div className="glass-card p-1.5 inline-flex items-center gap-1 self-start">
      {months.map((m) => {
        const isActive = m === active;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
              isActive
                ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
};
