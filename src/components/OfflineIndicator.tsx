import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Indicador discreto exibido quando o navegador detecta que está offline.
 * Não altera layout das páginas — fica fixo no rodapé acima da bottom nav.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

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

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-full bg-foreground/90 text-background px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>Você está offline</span>
    </div>
  );
}
