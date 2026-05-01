import { CHECKOUT_ANUAL, CHECKOUT_MENSAL } from "@/config/checkout";

export const CTASection = () => (
  <section className="py-20 md:py-28 px-4 md:px-6">
    <div className="max-w-4xl mx-auto lp-card p-8 md:p-14 text-center backdrop-blur-2xl">
      <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight leading-tight">
        Comece a organizar suas finanças{" "}
        <span className="lp-italic-gradient italic font-normal">hoje</span>
      </h2>
      <p className="text-white/65 mt-5 max-w-xl mx-auto">
        Em menos de 1 minuto você já está dentro, com a nex.ia pronta para te ajudar a tomar
        decisões melhores com seu dinheiro.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <a
          href={CHECKOUT_MENSAL}
          className="lp-btn-outline w-full sm:w-auto px-7 py-3.5 rounded-full text-sm md:text-base"
        >
          Mensal — R$ 19,90
        </a>
        <a
          href={CHECKOUT_ANUAL}
          className="lp-btn-primary w-full sm:w-auto px-7 py-3.5 rounded-full text-sm md:text-base"
        >
          Anual — R$ 149,90
        </a>
      </div>

      <p className="mt-6 text-white/45 text-xs">
        Leva menos de 1 minuto para começar • Sem fidelidade • Acesso imediato
      </p>
    </div>
  </section>
);
