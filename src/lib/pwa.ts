/**
 * Registra o Service Worker apenas em produção e fora de iframes/preview.
 * Em ambientes do editor Lovable (iframe ou hosts *.lovableproject.com /
 * id-preview-*) o SW é DESATIVADO e qualquer registro existente é removido,
 * para evitar cache antigo travando o preview.
 */
export function registerPWA() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost" ||
    host === "127.0.0.1";

  if (isInIframe || isPreviewHost || !import.meta.env.PROD) {
    // Limpa qualquer SW que tenha ficado registrado em sessões anteriores.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return;
  }

  // Em produção, no domínio publicado: registra via vite-plugin-pwa
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // silencioso — sem PWA também o app continua funcionando
    });
}
