import { Star } from "lucide-react";

type T = { name: string; role: string; text: string };

const items: T[] = [
  { name: "Lucas Mendes", role: "Empreendedor", text: "Aumentei R$ 240 mil entre investimentos e gastos pessoais no mesmo lugar. A visão de patrimônio em tempo real é o que eu sempre quis e nunca achei em outro app." },
  { name: "Camila Rocha", role: "Analista de marketing", text: "Parei de pagar mais de R$ 180 por mês em juros bobos depois que comecei a usar o calendário financeiro. Nunca mais esqueci um vencimento." },
  { name: "Pedro Santana", role: "Arquiteto", text: "Em um mês economizei mais de R$ 1.200 sem me sentir privado. Perguntei pra nex.ia onde eu podia cortar e ela mapeou tudo: delivery, transporte, lazer." },
  { name: "Beatriz Lima", role: "Advogada", text: "Reduzi meus gastos já no segundo mês. Categorização perfeita — abro o app e vejo tudo no fecho. Nunca foi tão simples." },
  { name: "Rafael Souza", role: "Designer", text: "Os limites por categoria me salvaram. Quando passo de 80% recebo o alerta e consigo segurar antes de estourar." },
  { name: "Marina Alves", role: "Médica", text: "A nex.ia me deu insights que nem meu contador tinha enxergado. Vale cada centavo." },
  { name: "Thiago Costa", role: "Engenheiro", text: "Conectei meus cartões e o app organizou tudo sozinho. Em 5 minutos tinha um panorama completo das minhas finanças." },
  { name: "Júlia Ferreira", role: "Professora", text: "Comecei a investir depois que vi onde estava perdendo dinheiro com assinaturas paradas. Mudou meu jeito de pensar." },
];

const initials = (n: string) => n.split(" ").slice(0, 2).map((s) => s[0]).join("");

const Card = ({ t }: { t: T }) => (
  <div className="shrink-0 w-[320px] sm:w-[360px] mx-3 rounded-2xl bg-white/[0.03] border border-white/10 p-6 backdrop-blur-md">
    <div className="flex gap-1 mb-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} className="w-4 h-4 fill-neon text-neon" />
      ))}
    </div>
    <p className="text-white/80 text-sm leading-relaxed mb-6">"{t.text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-neon font-semibold text-sm">
        {initials(t.name)}
      </div>
      <div>
        <div className="text-white text-sm font-semibold">{t.name}</div>
        <div className="text-white/50 text-xs">{t.role}</div>
      </div>
    </div>
  </div>
);

const Row = ({ reverse = false }: { reverse?: boolean }) => {
  const list = reverse ? [...items].reverse() : items;
  return (
    <div className="flex w-max" style={{ animationPlayState: "running" }}>
      {[...list, ...list].map((t, i) => (
        <Card key={i} t={t} />
      ))}
    </div>
  );
};

export const TestimonialsSection = () => {
  return (
    <section className="relative py-24 px-5 sm:px-8 overflow-hidden">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-neon text-xs font-medium mb-6">
          ● Quem usa, recomenda
        </span>
        <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
          Histórias reais de quem assumiu{" "}
          <span className="font-playfair italic font-medium">o controle</span>
        </h2>
        <p className="mt-6 max-w-2xl mx-auto text-white/60">
          Veja o que os usuários do Nexvior estão dizendo sobre como o app transformou a relação deles com o dinheiro.
        </p>
      </div>

      <div className="relative space-y-6">
        <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

        <div className="overflow-hidden">
          <div className="animate-marquee"><Row /></div>
        </div>
        <div className="overflow-hidden">
          <div className="animate-marquee-reverse"><Row reverse /></div>
        </div>
      </div>
    </section>
  );
};
