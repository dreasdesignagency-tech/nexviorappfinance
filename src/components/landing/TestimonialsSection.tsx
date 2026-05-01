const testimonials = [
  { name: "Carolina M.", role: "Designer", text: "Em 2 meses economizei R$ 1.840 só vendo no Nexvior pra onde meu dinheiro ia." },
  { name: "Rafael S.", role: "Engenheiro", text: "A nex.ia me explicou meus gastos como ninguém. Sinto que tenho um mentor pessoal." },
  { name: "Júlia P.", role: "Empreendedora", text: "Finalmente entendi para onde meu dinheiro vai. Mudou minha relação com finanças." },
  { name: "André L.", role: "Médico", text: "Cartões, recorrentes, investimentos — tudo num lugar só. Simplesmente funciona." },
  { name: "Marina F.", role: "Professora", text: "O calendário financeiro me salvou de várias multas. Vale cada centavo." },
  { name: "Paulo H.", role: "Dev", text: "Saí do vermelho em 3 meses. A IA me mostrou exatamente onde cortar." },
  { name: "Beatriz R.", role: "Advogada", text: "Interface linda e a IA é absurdamente útil. Recomendo de olhos fechados." },
  { name: "Tiago N.", role: "Consultor", text: "Pago R$ 19,90 e recebo de volta em economia todo mês. Sem dúvida." },
];

const Card = ({ name, role, text }: (typeof testimonials)[number]) => (
  <div className="lp-card w-[320px] shrink-0 p-5 mr-4">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-full bg-[hsl(var(--lp-neon)/0.2)] flex items-center justify-center text-white font-semibold">
        {name[0]}
      </div>
      <div>
        <div className="text-white text-sm font-medium">{name}</div>
        <div className="text-white/50 text-xs">{role}</div>
      </div>
    </div>
    <p className="text-white/75 text-sm leading-relaxed">"{text}"</p>
  </div>
);

const Row = ({ reverse = false }: { reverse?: boolean }) => (
  <div className="relative overflow-hidden">
    <div
      className="flex"
      style={{
        animation: `lp-marquee 50s linear infinite`,
        animationDirection: reverse ? "reverse" : "normal",
      }}
    >
      {[...testimonials, ...testimonials].map((t, i) => (
        <Card key={i} {...t} />
      ))}
    </div>
  </div>
);

export const TestimonialsSection = () => (
  <section className="py-16 md:py-24 px-0">
    <div className="max-w-7xl mx-auto px-4 md:px-6 mb-10 text-center">
      <h2 className="text-3xl md:text-5xl font-semibold text-white tracking-tight">
        Quem usa, <span className="lp-italic-gradient italic font-normal">não volta</span>
      </h2>
      <p className="text-white/60 mt-3 max-w-xl mx-auto">
        Mais de milhares de pessoas já transformaram a relação com o próprio dinheiro.
      </p>
    </div>
    <div className="space-y-4">
      <Row />
      <Row reverse />
    </div>
  </section>
);
