import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { motion } from "motion/react";
import BlurText from "./BlurText";
import GradientText from "./GradientText";
import { Link } from "react-router-dom";

const smoothEase = [0.25, 0.1, 0.25, 1] as const;

export const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center overflow-hidden pt-20 md:pt-24">
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-32 text-center flex flex-col items-center justify-center">
        <motion.a
          href="#planos"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: smoothEase as any }}
          className="relative top-0 mt-0 mb-3 md:mb-4 inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-neon/10 backdrop-blur-sm border border-neon/30 hover:bg-neon/15 transition-colors cursor-pointer max-w-[95%]"
        >
          <Sparkles className="w-4 h-4 text-neon shrink-0" />
          <span className="text-xs md:text-sm text-foreground text-left">
            Planos a partir de <strong className="text-neon">R$ 19,90/mês</strong>
          </span>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.a>

        <h1 className="text-[1.75rem] xs:text-[2rem] sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-2 leading-[1.08] xs:leading-[1.1] md:leading-snug max-w-[14ch] xs:max-w-[15ch] sm:max-w-[18ch] md:max-w-[20ch] mx-auto text-center text-balance tracking-tight">
          {/* Mobile: same sentence with natural wrap */}
          <span className="md:hidden inline">
            Controle total das suas{" "}
            <span className="italic font-medium inline">
              <GradientText animationSpeed={5}>finanças</GradientText>
            </span>{" "}
            sem complicação
          </span>

          {/* Desktop: original flow */}
          <span className="hidden md:inline">
            <BlurText
              text="Controle total das suas"
              delay={60}
              className="inline"
              animateBy="words"
              direction="bottom"
              stepDuration={0.5}
              animationFrom={{ filter: "blur(12px)", opacity: 0, y: 30 }}
              animationTo={[
                { filter: "blur(4px)", opacity: 0.7, y: 8 },
                { filter: "blur(0px)", opacity: 1, y: 0 },
              ]}
            />{" "}
            <motion.span
              initial={{ filter: "blur(12px)", opacity: 0, y: 30 }}
              animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: smoothEase as any }}
              className="italic font-medium inline"
            >
              <GradientText animationSpeed={5}>finanças</GradientText>
            </motion.span>{" "}
            <BlurText
              text="sem complicação"
              delay={60}
              className="inline"
              animateBy="words"
              direction="bottom"
              stepDuration={0.5}
              animationFrom={{ filter: "blur(12px)", opacity: 0, y: 30 }}
              animationTo={[
                { filter: "blur(4px)", opacity: 0.7, y: 8 },
                { filter: "blur(0px)", opacity: 1, y: 0 },
              ]}
            />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.5, ease: smoothEase as any }}
          className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mt-6 md:mt-0 mb-8 md:mb-12 leading-relaxed px-2"
        >
          Organize seus gastos, cartões e investimentos em um só lugar com
          inteligência artificial que realmente te ajuda a economizar.
        </motion.p>

        <motion.div
          id="cta"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, delay: 0.7, ease: smoothEase as any }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/auth" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto bg-neon text-white hover:bg-neon-glow hover:text-white font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full transition-all duration-300 shadow-[0_0_30px_hsl(var(--lp-neon)/0.4),0_0_60px_hsl(var(--lp-neon)/0.2)]"
            >
              <ArrowRight className="w-5 h-5 mr-2" />
              Começar por R$ 19,90/mês
            </Button>
          </Link>
          <a href="#recursos" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-foreground/20 hover:bg-neon hover:border-neon hover:text-white text-foreground font-semibold text-base md:text-lg px-6 md:px-8 py-5 md:py-6 rounded-full transition-all duration-300"
            >
              Ver como funciona
            </Button>
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.95, ease: smoothEase as any }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs md:text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-neon" /> Sem fidelidade</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-neon" /> Cancele quando quiser</span>
          <span className="inline-flex items-center gap-1.5"><Check className="w-4 h-4 text-neon" /> Acesso imediato</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
