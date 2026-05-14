import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type BackendError = {
  message: string;
  code: string;
  status: number;
  details?: string;
  hint?: string;
};

const rawUrl = String(import.meta.env.VITE_SUPABASE_URL ?? "").trim();
const rawPublishableKey = String(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
).trim();

const warnedScopes = new Set<string>();

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};

const isValidPublishableKey = (value: string) => {
  if (!value) return false;
  return value.startsWith("sb_publishable_") || value.split(".").length === 3 || value.length > 20;
};

const urlConfigured = isValidUrl(rawUrl);
const keyConfigured = isValidPublishableKey(rawPublishableKey);
const backendReason = !urlConfigured
  ? "VITE_SUPABASE_URL ausente ou inválida"
  : !keyConfigured
    ? "VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY ausente ou inválida"
    : null;

const buildBackendError = (scope: string): BackendError => ({
  message: `Backend indisponível para ${scope}. O Nexvior entrou em modo seguro.`,
  code: "BACKEND_UNAVAILABLE",
  status: 503,
  details: backendReason ?? undefined,
  hint: "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para reativar a sincronização.",
});

const resolveBackendError = <T,>(scope: string, data: T | null = null) =>
  Promise.resolve({ data, error: buildBackendError(scope) });

const createNoopQueryBuilder = (table: string) => {
  const scope = `tabela ${table}`;
  const builder: any = {};
  const chain = () => builder;

  builder.select = chain;
  builder.insert = chain;
  builder.update = chain;
  builder.delete = chain;
  builder.upsert = chain;
  builder.eq = chain;
  builder.neq = chain;
  builder.in = chain;
  builder.order = chain;
  builder.limit = chain;
  builder.match = chain;
  builder.ilike = chain;
  builder.is = chain;

  builder.single = () => resolveBackendError(scope);
  builder.maybeSingle = () => resolveBackendError(scope);
  builder.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) =>
    resolveBackendError(scope).then(onFulfilled, onRejected);
  builder.catch = (onRejected: (reason: unknown) => unknown) => resolveBackendError(scope).catch(onRejected);
  builder.finally = (onFinally: () => void) => resolveBackendError(scope).finally(onFinally);

  return builder;
};

const noopAuth = {
  getSession: async () => ({ data: { session: null }, error: buildBackendError("sessão") }),
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: buildBackendError("login") }),
  signUp: async () => ({ data: { user: null, session: null }, error: buildBackendError("cadastro") }),
  signInWithOAuth: async () => ({ data: { provider: "google", url: null }, error: buildBackendError("login social") }),
  exchangeCodeForSession: async () => ({ data: { session: null, user: null }, error: buildBackendError("callback de autenticação") }),
  verifyOtp: async () => ({ data: { session: null, user: null }, error: buildBackendError("verificação de e-mail") }),
  setSession: async () => ({ data: { session: null, user: null }, error: buildBackendError("restauração de sessão") }),
};

const noopStorage = {
  from: (bucket: string) => ({
    upload: async () => ({ data: null, error: buildBackendError(`storage ${bucket}`) }),
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  }),
};

const noopSupabase = {
  from: (table: string) => createNoopQueryBuilder(table),
  rpc: (fn: string) => resolveBackendError(`função ${fn}`),
  auth: noopAuth,
  storage: noopStorage,
};

export const supabaseConfig = {
  url: urlConfigured ? rawUrl : "",
  usesNextPublicVars: false,
  urlConfigured,
  keyConfigured,
  isConfigured: urlConfigured && keyConfigured,
  safeMode: !(urlConfigured && keyConfigured),
  reason: backendReason,
};

export const getBackendUnavailableMessage = (scope = "este recurso") =>
  `O backend não está configurado agora. ${scope} segue em modo seguro.`;

export const canUseBackend = (scope: string, options?: { silent?: boolean }) => {
  if (supabaseConfig.isConfigured) return true;

  if (!options?.silent && !warnedScopes.has(scope)) {
    console.warn(`[backend:safe-mode] ${scope}`, {
      reason: supabaseConfig.reason,
      urlConfigured: supabaseConfig.urlConfigured,
      keyConfigured: supabaseConfig.keyConfigured,
    });
    warnedScopes.add(scope);
  }

  return false;
};

// Safe storage: some browsers (Safari private mode, Brave with strict shields,
// Opera privacy mode) throw when accessing localStorage. Fall back to an
// in-memory store so the auth client can still function during the session
// instead of crashing and effectively "logging the user out".
const createSafeStorage = () => {
  if (typeof window === "undefined") return undefined;

  const memory = new Map<string, string>();
  let canUseLocal = false;
  try {
    const probe = "__nexvior_storage_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    canUseLocal = true;
  } catch (err) {
    console.warn("[auth:storage] localStorage bloqueado, usando memória", err);
  }

  return {
    getItem: (key: string) => {
      if (canUseLocal) {
        try {
          return window.localStorage.getItem(key);
        } catch (err) {
          console.warn("[auth:storage] getItem falhou, fallback memória", err);
        }
      }
      return memory.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      memory.set(key, value);
      if (canUseLocal) {
        try {
          window.localStorage.setItem(key, value);
        } catch (err) {
          console.warn("[auth:storage] setItem falhou, mantido em memória", err);
        }
      }
    },
    removeItem: (key: string) => {
      memory.delete(key);
      if (canUseLocal) {
        try {
          window.localStorage.removeItem(key);
        } catch (err) {
          console.warn("[auth:storage] removeItem falhou", err);
        }
      }
    },
  };
};

// Detect navigator.locks support (Safari < 15.4 lacks it). Without it, multi-tab
// refresh tokens race and revoke each other, causing the user to be signed out
// shortly after login on Safari/Brave/Opera in older macOS versions.
if (typeof window !== "undefined") {
  const hasLocks = typeof (navigator as any)?.locks?.request === "function";
  if (!hasLocks) {
    console.warn("[auth:storage] navigator.locks indisponível — multi-aba pode revogar tokens (Safari antigo)");
  }
}

export const supabase: any = supabaseConfig.isConfigured
  ? createClient<Database>(rawUrl, rawPublishableKey, {
      auth: {
        storage: createSafeStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : noopSupabase;
