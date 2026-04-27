import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  MoreVertical,
  Plus,
  Share,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SEEN_KEY = "nexvior:install-tour-seen-v1";
const NEVER_KEY = "nexvior:install-tour-never-v1";

type Platform = "ios" | "android" | "desktop";

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || (navigator as any).vendor || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
};

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia?.("(display-mode: standalone)").matches;
  // iOS Safari
  const iosStandalone = (window.navigator as any).standalone === true;
  return Boolean(mql || iosStandalone);
};

export const hasSeenInstallTour = () => {
  try {
    return (
      localStorage.getItem(SEEN_KEY) === "1" ||
      localStorage.getItem(NEVER_KEY) === "1"
    );
  } catch {
    return false;
  }
};

export const markInstallTourSeen = () => {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
};

export const markInstallTourNever = () => {
  try {
    localStorage.setItem(NEVER_KEY, "1");
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
};

export const resetInstallTour = () => {
  try {
    localStorage.removeItem(SEEN_KEY);
    localStorage.removeItem(NEVER_KEY);
  } catch {
    /* ignore */
  }
};

/** Verifica se o tutorial deve ser exibido automaticamente. */
export const shouldShowInstallTourAuto = () => {
  if (typeof window === "undefined") return false;
  if (isStandalone()) return false;
  const platform = detectPlatform();
  if (platform === "desktop") return false;
  if (hasSeenInstallTour()) return false;
  return true;
};

interface Props {
  open: boolean;
  onClose: () => void;
  /** Forçar plataforma para preview/testes */
  forcePlatform?: Platform;
}

export const InstallAppTour = ({ open, onClose, forcePlatform }: Props) => {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const deferredPromptRef = useRef<any>(null);
  const [canPrompt, setCanPrompt] = useState(false);

  useEffect(() => {
    setPlatform(forcePlatform ?? detectPlatform());
  }, [forcePlatform, open]);

  // Captura o evento de instalação nativa do Android/Chrome
  useEffect(() => {
    const onBefore = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", onBefore as any);
    return () =>
      window.removeEventListener("beforeinstallprompt", onBefore as any);
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Bloqueia scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const close = () => {
    markInstallTourSeen();
    onClose();
  };

  const never = () => {
    markInstallTourNever();
    onClose();
  };

  const installNow = async () => {
    const dp = deferredPromptRef.current;
    if (!dp) return;
    try {
      dp.prompt();
      await dp.userChoice;
    } catch {
      /* ignore */
    } finally {
      deferredPromptRef.current = null;
      setCanPrompt(false);
      close();
    }
  };

  // Define passos conforme plataforma
  const platformStep =
    platform === "ios" ? (
      <IOSInstructions />
    ) : platform === "android" ? (
      <AndroidInstructions />
    ) : (
      <DesktopInstructions />
    );

  const screens = [
    {
      key: "intro",
      content: (
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 shadow-[0_10px_30px_hsl(var(--primary)/0.4)]">
            <Smartphone className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Instale o Nexvior no seu celular
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Acesse mais rápido, como um app de verdade. Sem precisar abrir o
            navegador.
          </p>
        </div>
      ),
    },
    {
      key: "how",
      content: platformStep,
    },
    {
      key: "ready",
      content: (
        <div className="text-center">
          <div className="text-5xl mb-2">✨</div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Pronto para instalar
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {canPrompt
              ? "Toque em “Instalar agora” para adicionar o Nexvior à sua tela inicial."
              : "Siga os passos do seu navegador para finalizar a instalação."}
          </p>
        </div>
      ),
    },
  ];

  const isLast = step === screens.length - 1;
  const isFirst = step === 0;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md glass-card rounded-2xl border border-primary/30 shadow-[0_30px_80px_hsl(var(--primary)/0.35)] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        <button
          type="button"
          onClick={close}
          aria-label="Fechar"
          className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-surface-elevated/60 text-muted-foreground hover:text-foreground flex items-center justify-center transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div key={screens[step].key} className="animate-in fade-in slide-in-from-right-2 duration-300">
            {screens[step].content}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {screens.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-6 bg-gradient-to-r from-primary to-primary-glow"
                    : "w-1.5 bg-surface-elevated"
                }`}
              />
            ))}
          </div>

          {/* Navegação */}
          <div className="flex items-center gap-2 mt-5">
            {!isFirst ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                className="gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={close}
                className="text-muted-foreground"
              >
                Agora não
              </Button>
            )}

            {isLast ? (
              canPrompt ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={installNow}
                  className="ml-auto gap-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary"
                >
                  <Download className="w-4 h-4" />
                  Instalar agora
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={close}
                  className="ml-auto bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary"
                >
                  Entendi
                </Button>
              )
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((s) => s + 1)}
                className="ml-auto gap-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {isFirst && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={never}
                className="text-[11px] text-muted-foreground hover:text-foreground transition underline-offset-2 hover:underline"
              >
                Não mostrar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

/* ---------------- Instruções por plataforma ---------------- */

const StepRow = ({
  n,
  icon,
  title,
}: {
  n: number;
  icon: React.ReactNode;
  title: React.ReactNode;
}) => (
  <li className="flex items-start gap-3 p-3 rounded-xl bg-surface-elevated/40 border border-border/50">
    <span className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-xs font-bold flex items-center justify-center shadow-[0_4px_12px_hsl(var(--primary)/0.4)]">
      {n}
    </span>
    <div className="flex-1 min-w-0">
      <p className="text-sm leading-relaxed">{title}</p>
    </div>
    <span className="shrink-0 w-8 h-8 rounded-lg bg-background/50 border border-border/50 flex items-center justify-center text-primary">
      {icon}
    </span>
  </li>
);

const AndroidInstructions = () => (
  <div>
    <h3 className="text-lg font-bold tracking-tight text-center">
      Como instalar no Android
    </h3>
    <p className="text-xs text-muted-foreground text-center mt-1">
      Pelo Google Chrome
    </p>
    <ol className="space-y-2 mt-4">
      <StepRow
        n={1}
        icon={<MoreVertical className="w-4 h-4" />}
        title={
          <>
            Toque nos <strong>3 pontinhos</strong> (⋮) no canto superior do
            navegador
          </>
        }
      />
      <StepRow
        n={2}
        icon={<Plus className="w-4 h-4" />}
        title={
          <>
            Toque em <strong>“Adicionar à tela inicial”</strong>
          </>
        }
      />
      <StepRow
        n={3}
        icon={<Download className="w-4 h-4" />}
        title={<>Confirme tocando em <strong>Adicionar</strong></>}
      />
    </ol>
  </div>
);

const IOSInstructions = () => (
  <div>
    <h3 className="text-lg font-bold tracking-tight text-center">
      Como instalar no iPhone
    </h3>
    <p className="text-xs text-muted-foreground text-center mt-1">
      Pelo Safari
    </p>
    <ol className="space-y-2 mt-4">
      <StepRow
        n={1}
        icon={<Share className="w-4 h-4" />}
        title={
          <>
            Toque no botão de <strong>Compartilhar</strong> (ícone de seta para
            cima)
          </>
        }
      />
      <StepRow
        n={2}
        icon={<Plus className="w-4 h-4" />}
        title={
          <>
            Role e toque em <strong>“Adicionar à Tela de Início”</strong>
          </>
        }
      />
      <StepRow
        n={3}
        icon={<Download className="w-4 h-4" />}
        title={<>Confirme tocando em <strong>Adicionar</strong></>}
      />
    </ol>
  </div>
);

const DesktopInstructions = () => (
  <div className="text-center">
    <h3 className="text-lg font-bold tracking-tight">
      Instale também no celular
    </h3>
    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
      Abra o Nexvior no seu iPhone ou Android para instalar como aplicativo na
      tela inicial.
    </p>
  </div>
);
