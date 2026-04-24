export const OFFICIAL_APP_URL = "https://nexviorappfinance.vercel.app";
export const OFFICIAL_HOST = new URL(OFFICIAL_APP_URL).hostname;

export const isLocalHostname = (hostname: string) =>
  hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");

export const isLovableHostname = (hostname: string) => hostname.includes("lovable.app");

export const getAppOrigin = () => {
  if (typeof window === "undefined") {
    return OFFICIAL_APP_URL;
  }

  const { hostname, origin } = window.location;

  if (isLocalHostname(hostname) || hostname === OFFICIAL_HOST) {
    return origin;
  }

  return OFFICIAL_APP_URL;
};

export const getAuthCallbackUrl = () => `${getAppOrigin()}/auth/callback`;

export const buildOfficialUrl = (
  pathname = "/",
  search = "",
  hash = "",
) => {
  const url = new URL(pathname, OFFICIAL_APP_URL);
  url.search = search.startsWith("?") ? search.slice(1) : search;
  url.hash = hash.startsWith("#") ? hash.slice(1) : hash;
  return url.toString();
};

export const shouldForceOfficialDomain = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const { hostname } = window.location;
  return !isLocalHostname(hostname) && isLovableHostname(hostname);
};

export const redirectToOfficialLocation = (
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
  search = typeof window !== "undefined" ? window.location.search : "",
  hash = typeof window !== "undefined" ? window.location.hash : "",
) => {
  if (typeof window === "undefined") return;
  window.location.replace(buildOfficialUrl(pathname, search, hash));
};