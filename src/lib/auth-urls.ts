// Official public domain (Vercel). All auth redirects and shareable links
// must point here so confirmation emails never open the Lovable preview
// (which shows a "Request Access" screen) or any other host.
export const OFFICIAL_APP_URL = "https://nexviorappfinance.vercel.app";
export const OFFICIAL_HOST = "nexviorappfinance.vercel.app";

export const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

export const isLovableHostname = (hostname: string) => hostname.includes("lovable.app");

/**
 * Returns the origin to use for auth redirects and public links.
 * - In local dev: use the current origin (so callbacks work on localhost).
 * - Everywhere else (Lovable preview, published .lovable.app, Vercel):
 *   always use the official Vercel domain.
 */
export const getAppOrigin = () => {
  if (typeof window === "undefined") return OFFICIAL_APP_URL;
  const host = window.location.hostname;
  if (isLocalHostname(host)) return window.location.origin;
  return OFFICIAL_APP_URL;
};

export const getAuthCallbackUrl = () => `${getAppOrigin()}/auth/callback`;

export const buildOfficialUrl = (pathname = "/", search = "", hash = "") => {
  const url = new URL(pathname, getAppOrigin());
  url.search = search.startsWith("?") ? search.slice(1) : search;
  url.hash = hash.startsWith("#") ? hash.slice(1) : hash;
  return url.toString();
};

/**
 * If the user lands on a non-official, non-local host (e.g. the Lovable
 * preview or published .lovable.app URL), bounce to the same path on the
 * official Vercel domain.
 */
export const shouldForceOfficialDomain = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (isLocalHostname(host)) return false;
  return host !== OFFICIAL_HOST;
};

export const redirectToOfficialLocation = () => {
  if (typeof window === "undefined") return;
  const target = buildOfficialUrl(
    window.location.pathname,
    window.location.search,
    window.location.hash,
  );
  window.location.replace(target);
};
