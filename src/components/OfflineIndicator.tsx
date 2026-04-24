import { useEffect, useState } from "react";
import { WifiOff, CloudOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/store/auth";
import { countPending } from "@/lib/offline/db";
import { onFlushDone } from "@/lib/offline/sync";

/**
 * Indicador discreto exibido quando o navegador detecta que está offline
 * ou quando há operações pendentes de sincronização.
 */
export function OfflineIndicator() {
  const { user } = useAuth();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setPending(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const c = await countPending(user.id);
      if (!cancelled) setPending(c);
    };
    refresh();
    const id = setInterval(refresh, 3000);
    const off = onFlushDone(() => refresh());
    return () => {
      cancelled = true;
      clearInterval(id);
      off();
    };
  }, [user, online]);

  if (online && pending === 0) return null;

  if (!online) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-foreground/90 text-background px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur max-w-[90vw]"
      >
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          Você está offline. As alterações serão sincronizadas quando a conexão voltar.
        </span>
      </div>
    );
  }

  // Online com pendentes
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-primary/90 text-primary-foreground px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur"
    >
      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
      <span>Sincronizando {pending} {pending === 1 ? "item" : "itens"}…</span>
    </div>
  );
}
