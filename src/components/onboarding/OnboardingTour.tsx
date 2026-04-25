import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nexvior:onboarding-seen-v1";

type Step = {
  selector: string;
  title: string;
  text: string;
  /** Forçar navegação para uma rota antes de destacar */
  route?: string;
  /** Quando o elemento alvo só existe no mobile */
  mobileOnly?: boolean;
  /** Quando o elemento alvo só existe no desktop */
  desktopOnly?: boolean;
  /** Selector alternativo (ex.: equivalente desktop) */
  altSelector?: string;
};

const STEPS: Step[] = [
  {
    selector: '[data-tour="new-transaction"]',
    altSelector: '[data-tour="new-transaction-desktop"]',
    title: "Nova Transação",
    text: "Aqui você registra suas receitas e despesas em poucos toques.",
    route: "/",
  },
  {
    selector: '[data-tour="nav-transacoes"]',
    title: "Transações",
    text: "Veja todo o histórico do seu dinheiro em um só lugar.",
    route: "/",
  },
  {
    selector: '[data-tour="nav-cartoes"]',
    title: "Cartões",
    text: "Controle seus gastos no cartão e o limite disponível.",
    route: "/",
  },
  {
    selector: '[data-tour="ai-insights"]',
    title: "Insight do mês (nex.ia)",
    text: "Receba análises inteligentes sobre seus gastos e hábitos.",
    route: "/",
  },
  {
    selector: '[data-tour="dashboard-summary"]',
    title: "Dashboard",
    text: "Aqui você vê o resumo completo da sua vida financeira.",
    route: "/",
  },
];

export const hasSeenOnboarding = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const markOnboardingSeen = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
};

export const resetOnboarding = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

type Phase = "welcome" | "step" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const OnboardingTour = ({ open, onClose }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<Phase>("welcome");
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setPhase("welcome");
      setStepIdx(0);
    }
  }, [open]);

  const step = STEPS[stepIdx];

  // Garantir rota correta
  useEffect(() => {
    if (!open || phase !== "step") return;
    if (step?.route && location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [open, phase, step, location.pathname, navigate]);

  // Localiza o elemento alvo e calcula o rect (com retry, pois layout pode mudar)
  useLayoutEffect(() => {
    if (!open || phase !== "step" || !step) return;

    let cancelled = false;
    let tries = 0;

    const findEl = (): HTMLElement | null => {
      const isMobile =
        typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
      // Preferir alt em desktop quando o principal é mobile-only
      const primary = document.querySelector<HTMLElement>(step.selector);
      const alt = step.altSelector
        ? document.querySelector<HTMLElement>(step.altSelector)
        : null;

      if (step.mobileOnly) return primary;
      if (step.desktopOnly) return alt ?? primary;

      if (isMobile) return primary ?? alt;
      return alt ?? primary;
    };

    const update = () => {
      const el = findEl();
      if (!el) {
        if (tries++ < 30 && !cancelled) {
          rafRef.current = window.setTimeout(update, 100) as unknown as number;
        }
        return;
      }
      // Garantir que está visível
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      // pequeno delay para o scroll terminar
      window.setTimeout(() => {
        if (cancelled) return;
        const r = el.getBoundingClientRect();
        setRect(r);
      }, 250);
    };

    update();

    const onResize = () => {
      const el = findEl();
      if (el) setRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      cancelled = true;
      if (rafRef.current) window.clearTimeout(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, phase, step]);

  // Bloquear scroll do body durante welcome/done
  useEffect(() => {
    if (!open) return;
    if (phase === "welcome" || phase === "done") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open, phase]);

  if (!open) return null;

  const skip = () => {
    markOnboardingSeen();
    onClose();
  };

  const finish = () => {
    markOnboardingSeen();
    onClose();
  };

  const next = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx((i) => i + 1);
      setRect(null);
    } else {
      setPhase("done");
    }
  };

  const back = () => {
    if (stepIdx > 0) {
      setStepIdx((i) => i - 1);
      setRect(null);
    } else {
      setPhase("welcome");
    }
  };

  // ---------- WELCOME ----------
  if (phase === "welcome") {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md glass-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-[0_30px_80px_hsl(var(--primary)/0.35)] animate-in zoom-in-95 duration-300">
          <button
            type="button"
            onClick={skip}
            aria-label="Fechar"
            className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-surface-elevated/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Bem-vindo ao Nexvior 🚀
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Organize sua vida financeira de forma simples e inteligente.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <Button
              onClick={() => setPhase("step")}
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary"
            >
              Começar tutorial
            </Button>
            <Button onClick={skip} variant="ghost" className="flex-1">
              Pular
            </Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ---------- DONE ----------
  if (phase === "done") {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-md glass-card p-6 sm:p-8 rounded-2xl border border-primary/30 shadow-[0_30px_80px_hsl(var(--primary)/0.35)] text-center animate-in zoom-in-95 duration-300">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold tracking-tight">Tudo pronto!</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Agora você já pode começar a usar o Nexvior.
          </p>
          <Button
            onClick={finish}
            className="mt-6 w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary"
          >
            Começar agora
          </Button>
        </div>
      </div>,
      document.body
    );
  }

  // ---------- STEP (spotlight) ----------
  const PADDING = 10;
  const RADIUS = 14;
  const vw = typeof window !== "undefined" ? window.innerWidth : 0;
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;

  const haveRect = !!rect;
  const r = rect ?? new DOMRect(vw / 2 - 60, vh / 2 - 30, 120, 60);
  const holeX = Math.max(8, r.left - PADDING);
  const holeY = Math.max(8, r.top - PADDING);
  const holeW = r.width + PADDING * 2;
  const holeH = r.height + PADDING * 2;

  // Posiciona tooltip: tenta abaixo, senão acima, senão centralizado
  const TOOLTIP_W = Math.min(340, vw - 24);
  const TOOLTIP_H_EST = 180;
  let tipTop = r.bottom + 16;
  let tipLeft = r.left + r.width / 2 - TOOLTIP_W / 2;
  if (tipTop + TOOLTIP_H_EST > vh - 16) {
    tipTop = r.top - TOOLTIP_H_EST - 16;
  }
  if (tipTop < 16) {
    // empilhar no fundo
    tipTop = vh - TOOLTIP_H_EST - 24;
  }
  tipLeft = Math.max(12, Math.min(tipLeft, vw - TOOLTIP_W - 12));

  return createPortal(
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* SVG mask overlay com recorte no elemento alvo */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        onClick={(e) => {
          // clicar fora do tooltip não fecha; só absorve cliques no overlay
          e.stopPropagation();
        }}
      >
        <defs>
          <mask id="onboarding-mask">
            <rect width="100%" height="100%" fill="white" />
            {haveRect && (
              <rect
                x={holeX}
                y={holeY}
                width={holeW}
                height={holeH}
                rx={RADIUS}
                ry={RADIUS}
                fill="black"
                style={{ transition: "all 300ms ease" }}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="hsl(var(--background) / 0.78)"
          mask="url(#onboarding-mask)"
          style={{ backdropFilter: "blur(2px)" }}
        />
        {haveRect && (
          <rect
            x={holeX}
            y={holeY}
            width={holeW}
            height={holeH}
            rx={RADIUS}
            ry={RADIUS}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            style={{
              filter: "drop-shadow(0 0 16px hsl(var(--primary) / 0.7))",
              transition: "all 300ms ease",
            }}
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="absolute pointer-events-auto glass-card border border-primary/30 rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_hsl(var(--primary)/0.35)] animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          top: tipTop,
          left: tipLeft,
          width: TOOLTIP_W,
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
            {stepIdx + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={skip}
            className="text-[11px] text-muted-foreground hover:text-foreground transition"
          >
            Pular
          </button>
        </div>
        <h3 className="text-base font-bold tracking-tight">{step.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {step.text}
        </p>

        {/* Progress bar */}
        <div className="mt-3 h-1 rounded-full bg-surface-elevated/60 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={back}
            className="gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={next}
            className="ml-auto gap-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
          >
            {stepIdx === STEPS.length - 1 ? "Concluir" : "Próximo"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
