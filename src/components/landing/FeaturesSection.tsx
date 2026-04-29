import { Wallet, CreditCard, TrendingUp, Repeat, HeartPulse, Target, Bell, Sparkles } from "lucide-react";

const features = [
  { icon: Wallet, title: "Veja para onde seu dinheiro vai", text: "Registre receitas e despesas em segundos e tenha clareza total de cada real que entra e sai todo mês." },
  { icon: CreditCard, title: "Nunca mais leve susto na fatura", text: "Todos os seus cartões, limites, parcelas e faturas em um único painel — sem surpresas no fim do mês." },
  { icon: TrendingUp, title: "Acompanhe seu patrimônio em tempo real", text: "Investimentos, rentabilidade média e evolução do seu patrimônio atualizados automaticamente para você." },
  { icon: Repeat, title: "Controle assinaturas e recorrentes", text: "Saiba exatamente quanto está comprometido com parcelas e assinaturas — e descubra o que cortar." },
  { icon: HeartPulse, title: "Saúde financeira", text: "Receba uma nota de saúde financeira com diagnóstico claro do que está indo bem — e o que precisa melhorar." },
  { icon: Target, title: "Limites e metas", text: "Defina limites por categoria e metas mensais. O Nexvior te avisa antes de você estourar o orçamento." },
  { icon: Bell, title: "Notificações e calendário", text: "Compromissos financeiros num calendário visual e alertas de vencimentos diretamente no app." },
  { icon: Sparkles, title: "nex.ia, sua mentora", text: "Uma IA financeira que analisa seus dados e responde perguntas como: 'onde posso economizar este mês?'" },
];

export const FeaturesSection = () => {
  return (
    <section id="recursos" className="relative py-28 px-5 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-neon text-xs font-medium mb-6">
            ● Tudo que o Nexvior faz por você
          </span>
          <h2 className="font-black text-white text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight">
            Sua vida financeira,<br />
            <span>simples e clara</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-white/60">
            Do controle de gastos à inteligência artificial que te orienta, o Nexvior reúne tudo que você precisa para tomar decisões melhores com o seu dinheiro.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="group rounded-2xl bg-white/[0.02] border border-white/10 p-7 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_60px_hsl(var(--primary)/0.18)] transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center mb-6 group-hover:neon-glow transition-shadow">
                <Icon className="w-5 h-5 text-neon" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
