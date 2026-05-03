import { motion } from "motion/react";
import { Sparkles, Send, Zap } from "lucide-react";

const sugestoes = [
  "Onde estou gastando mais esse mês?",
  "Como posso economizar mais?",
  "Minha saúde financeira está boa?",
  "Vale a pena parcelar essa compra?",
];

export const NexIASection = () => {
  return (
    <section id="nexia" className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon/10 border border-neon/20 mb-6">
              <Sparkles className="w-4 h-4 text-neon" />
              <span className="text-sm text-neon font-medium">nex.ia • IA financeira</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
              Uma mentora financeira <span className="italic">no seu bolso</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
              Pergunte qualquer coisa sobre o seu dinheiro e receba uma resposta{" "}
              <strong className="text-foreground">instantânea e personalizada</strong> — baseada nas suas transações reais, não em respostas genéricas.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon/10 border border-neon/20 mb-5">
              <Zap className="w-3.5 h-3.5 text-neon" />
              <span className="text-xs text-neon font-medium">Resposta em segundos</span>
            </div>

            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-2 shrink-0" />Diagnóstico personalizado da sua saúde financeira.</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-2 shrink-0" />Sugestões de economia baseadas no seu perfil de gastos.</li>
              <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-2 shrink-0" />Insights sobre investimentos e patrimônio em tempo real.</li>
            </ul>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl md:rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-4 md:p-6 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-neon/20 flex items-center justify-center border border-neon/30">
                <Sparkles className="w-5 h-5 text-neon" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">nex.ia</p>
                <p className="text-xs text-muted-foreground">Online agora</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm bg-neon/90 text-white">
                  Onde estou gastando mais esse mês?
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md px-4 py-3 text-sm bg-muted/40 text-foreground border border-border/40">
                  Sua maior categoria foi <strong>Alimentação</strong> (R$ 980), seguida por <strong>Transporte</strong> (R$ 540).
                  Detectei <strong>R$ 312</strong> em assinaturas pouco usadas — quer que eu liste?
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {sugestoes.map((s) => (
                <div key={s} className="text-xs px-3 py-2 rounded-xl border border-border/40 bg-muted/20 text-muted-foreground">
                  {s}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-11 px-4 rounded-full border border-border/40 bg-muted/20 text-sm text-muted-foreground flex items-center">
                Pergunte algo à nex.ia...
              </div>
              <div className="h-11 w-11 rounded-full bg-neon flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default NexIASection;
