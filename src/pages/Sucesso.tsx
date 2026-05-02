import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/store/auth";

const Sucesso = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, refresh } = useSubscription();
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Poll subscription status for up to ~20s while webhook propagates
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      await refresh();
      if (cancelled) return;
      if (attempts >= 10) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, refresh]);

  useEffect(() => {
    if (hasAccess) setPolling(false);
  }, [hasAccess]);

  return (
    <div className="lp-root min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 to-muted/20 backdrop-blur-md p-8 md:p-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-neon/15">
            <CheckCircle2 className="w-12 h-12 text-neon" />
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Pagamento confirmado!</h1>
        <p className="text-muted-foreground mb-8">
          {hasAccess
            ? "Seu acesso foi liberado com sucesso. Bem-vindo ao Nexvior."
            : polling
              ? "Estamos confirmando seu pagamento, isso leva alguns segundos…"
              : "Seu pagamento foi recebido. Se o acesso não for liberado em instantes, entre em contato com o suporte."}
        </p>
        <Button
          size="lg"
          disabled={polling && !hasAccess}
          onClick={() => navigate(hasAccess ? "/app" : "/planos")}
          className="w-full bg-neon text-white hover:bg-neon-glow font-semibold rounded-full"
        >
          {polling && !hasAccess ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirmando…
            </>
          ) : (
            "Entrar no app"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Sucesso;
