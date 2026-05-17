import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect } from "react";

const monthlyBenefits = [
  "Controle total de finanças",
  "Organização automática com IA",
  "Gestão de cartões, gastos e metas",
  "Insights inteligentes",
];

const annualBenefits = [
  "Tudo do plano mensal",
  "Economia no valor anual",
  "Prioridade em novos recursos",
];

const Planos = () => {
  const { user, loading: authLoading, loadingAuth, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<"mensal" | "anual" | null>(null);

  useEffect(() => {
    if (!authLoading && !loadingAuth && !user) {
      console.info("[auth] redirect", {
        from: "Planos",
        to: "/auth",
        reason: "no_user_after_auth_ready",
        authLoading,
        loadingAuth,
      });
      navigate("/auth", { replace: true });
    }
  }, [authLoading, loadingAuth, user, navigate]);

  useEffect(() => {
    if (!subLoading && hasAccess) {
      navigate("/app", { replace: true });
    }
  }, [subLoading, hasAccess, navigate]);

  const handleCheckout = async (plan: "mensal" | "anual") => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoadingPlan(plan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan, origin: window.location.origin },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("Checkout URL ausente");
      window.location.href = url;
    } catch (e) {
      console.error("[planos] checkout error", e);
      toast.error("Não foi possível iniciar o checkout. Tente novamente.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="lp-root min-h-screen bg-background text-foreground py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-end mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              navigate("/auth", { replace: true });
            }}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Escolha o plano <span className="font-playfair italic">ideal</span> para você
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Para acessar o Nexvior, escolha um dos planos abaixo. Acesso liberado imediatamente após o pagamento.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto items-stretch">
          {/* MONTHLY */}
          <div className="relative rounded-2xl md:rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 to-muted/20 backdrop-blur-md p-8 md:p-10">
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">Plano Mensal</h3>
              <p className="text-sm text-muted-foreground">Ideal para começar agora</p>
            </div>
            <div className="mb-8 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-bold">R$ 9,90</span>
              <span className="text-muted-foreground text-base">/mês</span>
            </div>
            <ul className="space-y-3 mb-8">
              {monthlyBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                  <Check className="w-5 h-5 text-neon shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              variant="outline"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout("mensal")}
              className="w-full border-white/20 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/40 hover:text-white font-semibold rounded-full transition-all"
            >
              {loadingPlan === "mensal" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar mensal"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">Cancele quando quiser. Sem fidelidade.</p>
          </div>

          {/* ANNUAL */}
          <div className="relative rounded-2xl md:rounded-3xl border-2 border-neon/70 bg-gradient-to-br from-neon/15 via-card/70 to-muted/20 backdrop-blur-md p-8 md:p-10 shadow-[0_15px_50px_-12px_hsl(var(--lp-neon)/0.55)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-neon text-white text-xs font-semibold uppercase tracking-wide shadow-[0_0_30px_hsl(var(--lp-neon)/0.5)]">
                <Sparkles className="w-3.5 h-3.5" />
                Melhor escolha
              </span>
            </div>
            <div className="mb-6">
              <h3 className="text-xl md:text-2xl font-semibold mb-2">Plano Anual</h3>
              <p className="text-sm text-muted-foreground">Economize mais de 35%</p>
            </div>
            <div className="mb-2 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-bold">R$ 149,90</span>
              <span className="text-muted-foreground text-base">/ano</span>
            </div>
            <p className="mb-8 text-sm text-neon font-medium">Equivalente a menos de R$ 12/mês</p>
            <ul className="space-y-3 mb-8">
              {annualBenefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm md:text-base text-foreground/90">
                  <Check className="w-5 h-5 text-neon shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <Button
              size="lg"
              disabled={loadingPlan !== null}
              onClick={() => handleCheckout("anual")}
              className="w-full bg-neon text-white hover:bg-neon-glow hover:text-white font-semibold rounded-full transition-all shadow-[0_0_30px_hsl(var(--lp-neon)/0.5)]"
            >
              {loadingPlan === "anual" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar anual"}
            </Button>
            <p className="mt-4 text-center text-xs text-muted-foreground">Cancele quando quiser. Sem fidelidade.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planos;
