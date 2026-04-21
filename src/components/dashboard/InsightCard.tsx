import { Sparkles } from "lucide-react";

export const InsightCard = () => {
  return (
    <div className="glass-card p-5 relative overflow-hidden">
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-40 pointer-events-none"
        style={{ background: "var(--gradient-blob)" }}
      />
      <div className="flex items-start gap-4 relative">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary-glow" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-bold tracking-[0.15em] text-primary-glow">
            NEX IA · INSIGHT DO MÊS
          </p>
          <p className="text-sm text-foreground mt-1.5 leading-relaxed">
            Adicione transações para receber insights personalizados da{" "}
            <span className="font-semibold">nex.ia</span>!
          </p>
        </div>
      </div>
    </div>
  );
};
