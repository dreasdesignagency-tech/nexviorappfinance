import { Send, Sparkles, Zap } from "lucide-react";

const suggestions = [
  "Onde estou gastando mais esse mês?",
  "Como posso economizar mais?",
  "Minha saúde financeira está boa?",
  "Vale a pena parcelar essa compra?",
];

export const NexIASection = () => {
  return (
    <section id="nexia" className="relative py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-neon text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> nex.ia · IA financeira
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05]">
            Uma mentora financeira{" "}
            <span className="font-playfair italic font-medium">no seu bolso</span>
          </h2>
          <p className="mt-6 text-white/60 text-lg leading-relaxed">
            Pergunte qualquer coisa sobre o seu dinheiro e receba uma resposta{" "}
            <span className="text-white font-semibold">instantânea e personalizada</span> — baseada nas suas transações reais, não em respostas genéricas.
          </p>

          <div className="mt-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-neon text-sm font-medium">
              <Zap className="w-4 h-4" /> Resposta em segundos
            </span>
          </div>

          <ul className="mt-7 space-y-3 text-white/75">
            <li className="flex items-start gap-3"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon" /> Diagnóstico personalizado da sua saúde financeira.</li>
            <li className="flex items-start gap-3"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon" /> Sugestões de economia baseadas no seu perfil de gastos.</li>
            <li className="flex items-start gap-3"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neon" /> Insights sobre investimentos e patrimônio em tempo real.</li>
          </ul>
        </div>

        <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">nex.ia</div>
              <div className="text-white/50 text-xs">Online agora</div>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-white text-sm max-w-[80%]">
              Onde estou gastando mais esse mês?
            </div>
          </div>

          <div className="px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 text-white/85 text-sm mb-6">
            Sua maior categoria foi <strong>Alimentação</strong> (R$ 980), seguida por <strong>Transporte</strong> (R$ 540). Detectei <strong className="text-neon">R$ 312</strong> em assinaturas pouco usadas — quer que eu liste?
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {suggestions.map((s) => (
              <button
                key={s}
                className="text-left text-xs px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/70 hover:bg-white/5 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-full bg-white/[0.03] border border-white/10 text-white/40 text-sm">
              Pergunte algo à nex.ia...
            </div>
            <button className="w-11 h-11 rounded-full bg-gradient-to-r from-primary to-primary-glow text-white flex items-center justify-center neon-glow">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
