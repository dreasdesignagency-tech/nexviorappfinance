import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";

const DISMISS_KEY = "nexvior_beta_banner_dismissed";

export const BetaBanner = () => {
  const { subscription } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try { setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1"); } catch {}
  }, []);

  const isBeta =
    subscription?.subscription_status === "beta" ||
    subscription?.plan_type === "beta";

  if (!isBeta || dismissed) return null;

  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 text-xs md:text-sm">
      <div className="flex items-center gap-2 text-foreground">
        <Sparkles className="w-4 h-4 text-primary shrink-0" />
        <span>
          Você está usando o <strong>Nexvior Beta</strong> — acesso completo gratuito.
        </span>
      </div>
      <button
        aria-label="Fechar"
        onClick={() => {
          try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch {}
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
