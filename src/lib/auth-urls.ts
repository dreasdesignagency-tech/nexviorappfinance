// Same-domain auth: always operate on the current origin to avoid cross-domain
// jumps between the Lovable preview/published domain and any external host.
export const OFFICIAL_APP_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : "https://nexviorappfinance.lovable.app";

export const OFFICIAL_HOST =
  typeof window !== "undefined"
    ? window.location.hostname
    : "nexviorappfinance.lovable.app";

export const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

export const isLovableHostname = (hostname: string) => hostname.includes("lovable.app");

export const getAppOrigin = () => {
  if (typeof window === "undefined") return OFFICIAL_APP_URL;
  return window.location.origin;
};

export const getAuthCallbackUrl = () => `${getAppOrigin()}/auth/callback`;

export const buildOfficialUrl = (pathname = "/", search = "", hash = "") => {
  const url = new URL(pathname, getAppOrigin());
  url.search = search.startsWith("?") ? search.slice(1) : search;
  url.hash = hash.startsWith("#") ? hash.slice(1) : hash;
  return url.toString();
};

// Same-domain mode: never force a cross-domain redirect.
export const shouldForceOfficialDomain = () => false;

export const redirectToOfficialLocation = () => {
  // no-op in same-domain mode
};
