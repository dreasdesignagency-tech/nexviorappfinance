import { Check } from "lucide-react";
import { CHECKOUT_ANUAL, CHECKOUT_MENSAL } from "@/config/checkout";

const benefits = [
  "Acesso completo a todos os recursos",
  "nex.ia ilimitada (mentora com IA)",
  "Transações, cartões e investimentos",
  "Saúde financeira e calendário",
  "Notificações inteligentes",
  "Suporte prioritário",
];

const Plan = ({
  title,
  price,
  period,
  href,
  cta,
  highlight,
  badge,
  subPrice,
}: {
  title: string;
  price: string;
  period: string;
  href: string;
  cta: string;
  highlight?: boolean;
  badge?: string;
  subPrice?: string;
}) => (
  <div
    className={`lp-card relative p-7 md:p-8 flex flex-col ${
      highlight
        ? "lg:scale-105 border-[hsl(var(--lp-neon)/0.6)] lp-glow-strong"
        : ""
    }`}
  >
    {badge && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[hsl(var(--lp-neon))] text-white shadow-lg">
        {badge}
      </div>
    )}
    <div className="text-white/70 text-sm uppercase tracking-wide">{title}</div>
    <div className="mt-3 flex items-baseline gap-1">
      <span className="text-4xl md:text-5xl font-semibold text-white">{price}</span>
      <span className="text-white/55 text-sm">/{period}</span>
    </div>
    {subPrice && <div className="text-[hsl(var(--lp-neon-glow))] text-sm mt-1">{subPrice}</div>}

    <ul className="mt-6 space-y-2.5 flex-1">
      {benefits.map((b) => (
        <li key={b} className="flex items-start gap-2 text-white/75 text-sm">
          <Check size={16} className="text-[hsl(var(--lp-neon-glow))] mt-0.5 shrink-0" />
          {b}
        </li>
      ))}
    </ul>

    <a
      href={href}
      className={`mt-7 w-full text-center px-6 py-3.5 rounded-full text-sm font-medium ${
        highlight ? "lp-btn-primary" : "lp-btn-outline"
      }`}
    >
      {cta}
    </a>

    <div className="mt-4 text-center text-white/45 text-xs space-y-0.5">
      <p>Cancele quando quiser. Sem fidelidade.</p>
      <p>Acesso imediato após pagamento</p>
    </div>
  </div>
);

export const PricingSection = () => (
  <section id="planos" className="py-20 md:py-28 px-4 md:px-6">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-[hsl(var(--lp-neon-glow))] text-sm font-medium tracking-wide uppercase">
          Planos
        </p>
        <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight mt-3">
          Escolha o seu e{" "}
          <span className="lp-italic-gradient italic font-normal">comece hoje</span>
        </h2>
        <p className="text-white/60 mt-4 max-w-lg mx-auto">
          Sem fidelidade, sem letras miúdas. Cancele quando quiser.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch pt-4">
        <Plan
          title="Mensal"
          price="R$ 19,90"
          period="mês"
          href={CHECKOUT_MENSAL}
          cta="Começar agora"
        />
        <Plan
          title="Anual"
          price="R$ 149,90"
          period="ano"
          subPrice="Equivalente a menos de R$ 12,50/mês"
          href={CHECKOUT_ANUAL}
          cta="Quero economizar"
          highlight
          badge="Economize 37%"
        />
      </div>
    </div>
  </section>
);
