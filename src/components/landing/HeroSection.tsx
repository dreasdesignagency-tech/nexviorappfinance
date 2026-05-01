import { ArrowRight, Sparkles, Check } from "lucide-react";
import { motion } from "framer-motion";
import { CHECKOUT_MENSAL } from "@/config/checkout";
import { BlurText } from "./BlurText";

export const HeroSection = () => {
  return (
    <section id="top" className="relative pt-28 md:pt-36 pb-20 md:pb-28 px-4 md:px-6">
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <motion.a
          href="#planos"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(var(--lp-neon)/0.4)] bg-[hsl(var(--lp-neon)/0.08)] text-sm text-white/85 hover:bg-[hsl(var(--lp-neon)/0.15)] transition-colors mb-8"
        >
          <Sparkles size={14} className="text-[hsl(var(--lp-neon-glow))]" />
          Planos a partir de R$ 19,90/mês
          <ArrowRight size={14} />
        </motion.a>

        <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white leading-[1.05]">
          <BlurText text="Controle total das suas" />{" "}
          <span className="lp-italic-gradient italic font-normal">finanças</span>{" "}
          <BlurText text="sem complicação" delay={0.4} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-8 text-base md:text-xl text-white/65 max-w-2xl mx-auto"
        >
          Organize seus gastos, cartões e investimentos em um só lugar com inteligência
          artificial que realmente te ajuda a economizar.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href={CHECKOUT_MENSAL}
            className="lp-btn-primary w-full sm:w-auto px-7 py-3.5 rounded-full text-sm md:text-base"
          >
            Começar por R$ 19,90/mês
          </a>
          <a
            href="#recursos"
            className="lp-btn-outline w-full sm:w-auto px-7 py-3.5 rounded-full text-sm md:text-base"
          >
            Ver como funciona
          </a>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs md:text-sm text-white/55"
        >
          {["Sem fidelidade", "Cancele quando quiser", "Acesso imediato"].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check size={14} className="text-[hsl(var(--lp-neon-glow))]" />
              {t}
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};
