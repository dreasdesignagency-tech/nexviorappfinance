import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const messages = [
  { from: "user", text: "Quanto gastei com delivery esse mês?" },
  { from: "ai", text: "Você gastou R$ 487,30 em delivery — 23% acima da sua média. Quer que eu sugira um teto?" },
  { from: "user", text: "Posso comprar um celular de R$ 3.000?" },
  { from: "ai", text: "Pode, mas se parcelar em 10x compromete 18% da sua renda livre. À vista, sobra reserva de 2 meses." },
  { from: "user", text: "Como economizar mais?" },
  { from: "ai", text: "Identifiquei 3 assinaturas pouco usadas (R$ 142/mês) e seu Uber subiu 40% — posso te ajudar a renegociar." },
];

export const NexIASection = () => (
  <section id="nex-ia" className="py-20 md:py-28 px-4 md:px-6">
    <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
      <div>
        <div className="inline-flex items-center gap-2 text-[hsl(var(--lp-neon-glow))] text-sm font-medium uppercase tracking-wide">
          <Sparkles size={14} /> nex.ia
        </div>
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mt-4 leading-tight">
          Sua{" "}
          <span className="lp-italic-gradient italic font-normal">mentora financeira</span>{" "}
          pessoal, 24/7
        </h2>
        <p className="text-white/65 mt-5 text-base md:text-lg leading-relaxed">
          A nex.ia analisa seus dados em tempo real e responde como um consultor de verdade —
          sem julgamento, sem termos técnicos, com decisões claras pra você agir hoje.
        </p>
        <ul className="mt-6 space-y-2 text-white/70 text-sm">
          <li>• Respostas baseadas nas <strong className="text-white">suas</strong> finanças reais</li>
          <li>• Simulações de compras, viagens e metas</li>
          <li>• Sugestões personalizadas de economia</li>
        </ul>
      </div>

      <div className="relative">
        <div className="absolute -inset-6 bg-[hsl(var(--lp-neon)/0.25)] blur-3xl rounded-full pointer-events-none" />
        <div className="lp-card relative p-5 md:p-6 space-y-3">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.from === "user"
                    ? "bg-[hsl(var(--lp-neon)/0.9)] text-white rounded-br-sm"
                    : "bg-white/5 text-white/85 border border-white/10 rounded-bl-sm"
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);
