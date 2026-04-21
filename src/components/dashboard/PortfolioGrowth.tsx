import { ChevronRight } from "lucide-react";

export const PortfolioGrowth = () => {
  return (
    <div className="rounded-[var(--radius)] p-6 h-full relative overflow-hidden bg-gradient-portfolio border border-primary/30 shadow-card min-h-[280px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/20 via-transparent to-accent/30 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary-glow/30 blur-3xl" />

      <div className="relative flex items-start justify-between mb-2">
        <h3 className="text-sm font-medium text-foreground/90">Crescimento portfólio</h3>
        <button className="w-8 h-8 rounded-full bg-foreground/10 backdrop-blur flex items-center justify-center hover:bg-foreground/20 transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <p className="text-3xl font-bold tracking-tight">+12,4%</p>
        <p className="text-xs text-foreground/70 mt-1">ano até o momento</p>
      </div>

      <svg className="absolute bottom-0 left-0 w-full h-24" viewBox="0 0 300 80" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(var(--primary-glow))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 60 Q 50 55, 80 45 T 160 35 T 240 20 T 300 10 L 300 80 L 0 80 Z" fill="url(#lineGrad)" />
        <path d="M0 60 Q 50 55, 80 45 T 160 35 T 240 20 T 300 10" stroke="hsl(var(--primary-glow))" strokeWidth="2" fill="none" />
        <circle cx="280" cy="14" r="3" fill="hsl(var(--primary-glow))" />
      </svg>

      <span className="absolute bottom-4 right-4 text-[10px] text-foreground/60">R$ 68,2k</span>
    </div>
  );
};
