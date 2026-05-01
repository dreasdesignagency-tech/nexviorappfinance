import {
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  Repeat,
  HeartPulse,
  ShieldAlert,
  Bell,
  CalendarDays,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: ArrowLeftRight, title: "Transações automatizadas", desc: "Veja para onde seu dinheiro vai sem precisar anotar nada manualmente." },
  { icon: CreditCard, title: "Gestão de cartões", desc: "Todas as faturas, limites e gastos por cartão num painel só." },
  { icon: TrendingUp, title: "Acompanhamento de investimentos", desc: "Saiba quanto seu patrimônio cresceu — sem planilha, sem dor de cabeça." },
  { icon: Repeat, title: "Despesas recorrentes", desc: "Assinaturas e contas fixas previstas antes mesmo de chegarem." },
  { icon: HeartPulse, title: "Saúde financeira", desc: "Um score claro do seu momento financeiro, atualizado em tempo real." },
  { icon: ShieldAlert, title: "Limites e alertas", desc: "Defina tetos por categoria e seja avisado antes de estourar." },
  { icon: Bell, title: "Notificações inteligentes", desc: "Avisos no momento certo: vencimentos, picos de gasto e oportunidades." },
  { icon: CalendarDays, title: "Calendário financeiro", desc: "Toda sua vida financeira numa visão mensal simples e visual." },
];

export const FeaturesSection = () => (
  <section id="recursos" className="py-20 md:py-28 px-4 md:px-6">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-[hsl(var(--lp-neon-glow))] text-sm font-medium tracking-wide uppercase">
          Recursos
        </p>
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mt-3">
          Tudo que você precisa para{" "}
          <span className="lp-italic-gradient italic font-normal">decidir melhor</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="lp-card p-6 group hover:border-[hsl(var(--lp-neon)/0.5)] transition-colors"
          >
            <div className="w-11 h-11 rounded-xl bg-[hsl(var(--lp-neon)/0.12)] border border-[hsl(var(--lp-neon)/0.3)] flex items-center justify-center mb-4 group-hover:lp-glow transition-shadow">
              <f.icon size={20} className="text-[hsl(var(--lp-neon-glow))]" />
            </div>
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
