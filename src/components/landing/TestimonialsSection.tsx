import { Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  initials: string;
  text: string;
}

const testimonials: Testimonial[] = [
  { name: "Marina Costa", role: "Designer freelancer", initials: "MC", text: "Economizei mais de R$ 800 em 2 meses usando o Nexvior. A nex.ia me mostrou que eu gastava 600 reais por mês em assinaturas que nem usava." },
  { name: "Rafael Almeida", role: "Engenheiro de software", initials: "RA", text: "Cortei R$ 1.100 da minha fatura em 30 dias. O controle de cartões e parcelas é absurdamente bem feito — finalmente sei exatamente quanto vai cair na próxima fatura." },
  { name: "Juliana Prado", role: "Médica", initials: "JP", text: "Saí de nota 4.2 para 8.1 de saúde financeira em três meses seguindo as recomendações da nex.ia. Mudou completamente minha relação com dinheiro." },
  { name: "Lucas Mendes", role: "Empreendedor", initials: "LM", text: "Organizei R$ 240 mil entre investimentos e gastos pessoais no mesmo lugar. A visão de patrimônio em tempo real é o que eu sempre quis e nunca achei em outro app." },
  { name: "Camila Rocha", role: "Analista de marketing", initials: "CR", text: "Parei de pagar mais de R$ 180 por mês em juros bobos depois que comecei a usar o calendário financeiro. Nunca mais esqueci um vencimento." },
  { name: "Pedro Santana", role: "Arquiteto", initials: "PS", text: "Em um mês economizei mais de R$ 1.200 sem me sentir privado. Perguntei pra nex.ia onde eu podia cortar e ela mapeou tudo: delivery, transporte, lazer." },
  { name: "Beatriz Lima", role: "Advogada", initials: "BL", text: "Reduzi meus gastos em 22% no segundo mês. Categorização automática perfeita — abro o app, olho o resumo e fecho. Nunca foi tão fácil ter controle." },
  { name: "Thiago Ferreira", role: "Product manager", initials: "TF", text: "Bati minha primeira meta de reserva de emergência em 4 meses usando o Nexvior. Nível de detalhe combinado com simplicidade é impressionante." },
];

const TestimonialCard = ({ t }: { t: Testimonial }) => (
  <div className="w-[320px] sm:w-[360px] shrink-0 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md p-6 mx-3 flex flex-col gap-4">
    <div className="flex items-center gap-1 text-neon">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="w-4 h-4 fill-neon" />
      ))}
    </div>
    <p className="text-sm md:text-base text-foreground/90 leading-relaxed">"{t.text}"</p>
    <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/30">
      <div className="w-10 h-10 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center text-neon font-semibold text-sm">
        {t.initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t.name}</p>
        <p className="text-xs text-muted-foreground">{t.role}</p>
      </div>
    </div>
  </div>
);

export const TestimonialsSection = () => {
  const row1 = [...testimonials, ...testimonials];
  const row2 = [...testimonials.slice().reverse(), ...testimonials.slice().reverse()];

  return (
    <section className="relative py-16 md:py-24 px-4 md:px-6 overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-10 md:mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neon/10 border border-neon/20 mb-6">
            <div className="w-2 h-2 rounded-full bg-neon" />
            <span className="text-xs md:text-sm text-neon font-medium">Quem usa, recomenda</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 md:mb-6 leading-tight">
            Histórias reais de quem assumiu o <span className="font-playfair italic">controle</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Veja o que os usuários do Nexvior estão dizendo sobre como o app transformou a relação deles com o dinheiro.
          </p>
        </div>

        <div className="relative space-y-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10" />

          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee [animation-duration:60s]">
              {row1.map((t, i) => <TestimonialCard key={`r1-${i}`} t={t} />)}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex w-max animate-marquee-reverse [animation-duration:75s]">
              {row2.map((t, i) => <TestimonialCard key={`r2-${i}`} t={t} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
