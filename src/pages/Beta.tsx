import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const BETA_FLAG = "nexvior_beta_pending";

const Beta = () => {
  const { user, loading } = useAuth();
  const { subscription, refresh, hasAccess, loading: subLoading } = useSubscription();
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);

  // Persist intent so signup/login flow keeps it
  useEffect(() => {
    try { localStorage.setItem(BETA_FLAG, "1"); } catch {}
    document.title = "Nexvior Beta — Acesso gratuito";
  }, []);

  // Auto-activate beta when user is logged in but inactive
  useEffect(() => {
    const run = async () => {
      if (!user || subLoading || activating) return;
      if (subscription && subscription.subscription_status === "inactive") {
        setActivating(true);
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ subscription_status: "beta", plan_type: "beta" })
          .eq("user_id", user.id)
          .eq("subscription_status", "inactive");
        if (error) {
          console.error("[beta] activation error", error);
          toast.error("Não foi possível ativar o Beta. Tente novamente.");
          setActivating(false);
          return;
        }
        try { localStorage.removeItem(BETA_FLAG); } catch {}
        await refresh();
        toast.success("Beta ativado! Acesso liberado 🎉");
        navigate("/app", { replace: true });
      } else if (subscription && hasAccess) {
        try { localStorage.removeItem(BETA_FLAG); } catch {}
        navigate("/app", { replace: true });
      }
    };
    run();
  }, [user, subscription, subLoading, hasAccess, activating, refresh, navigate]);

  if (loading) return null;

  // Not logged in → show beta landing with CTA to signup
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
        <main className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 glow-primary mb-5 p-3.5">
            <Logo className="w-full h-full" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Acesso Beta
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            Nexvior Beta — gratuito
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Acesso completo ao app sem precisar de plano pago. Crie sua conta e comece agora.
          </p>
          <div className="glass-card p-6 space-y-3">
            <Button
              className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow glow-primary"
              onClick={() => navigate("/cadastro", { state: { from: "/beta" } })}
            >
              Criar conta no Beta
            </Button>
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => navigate("/login", { state: { from: "/beta" } })}
            >
              Já tenho conta
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
      Ativando seu acesso Beta…
    </div>
  );
};

export const isBetaPending = () => {
  try { return localStorage.getItem(BETA_FLAG) === "1"; } catch { return false; }
};

export default Beta;
