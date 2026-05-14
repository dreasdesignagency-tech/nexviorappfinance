import { createClient, processLock } from "@supabase/supabase-js";
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

type BrowserStorageName = "localStorage" | "sessionStorage";

const memoryStorage = new Map<string, string>();
const storageAvailability: Record<BrowserStorageName, boolean | null> = {
  localStorage: null,
  sessionStorage: null,
};

const AUTH_STORAGE_KEY_MATCHERS = [/auth-token/i, /^sb-.*auth-token/i, /^supabase\.auth\./i];

const isAuthStorageKey = (key: string) => AUTH_STORAGE_KEY_MATCHERS.some((matcher) => matcher.test(key));

const getBrowserStorage = (name: BrowserStorageName): Storage | null => {
  if (typeof window === "undefined") return null;
  try {
    return window[name];
  } catch {
    return null;
  }
};

const probeBrowserStorage = (name: BrowserStorageName) => {
  if (storageAvailability[name] !== null) return storageAvailability[name] as boolean;

  const storage = getBrowserStorage(name);
  if (!storage) {
    storageAvailability[name] = false;
    return false;
  }

  try {
    const probe = `__nexvior_${name}_probe__`;
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    storageAvailability[name] = true;
    return true;
  } catch (err) {
    storageAvailability[name] = false;
    console.warn(`[auth:storage] ${name} bloqueado`, err);
    return false;
  }
};

const listStorageKeys = (storage: Storage | null) => {
  if (!storage) return [] as string[];
  try {
    return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key));
  } catch {
    return [] as string[];
  }
};

const parseAuthPayload = (storageName: BrowserStorageName, storage: Storage, key: string, value: string | null) => {
  if (!value || !isAuthStorageKey(key)) return value;

  try {
    JSON.parse(value);
    return value;
  } catch (err) {
    console.warn("[auth:storage] sessão persistida corrompida detectada", {
      storage: storageName,
      key,
      error: err instanceof Error ? err.message : String(err),
    });
    try {
      storage.removeItem(key);
    } catch {
      // ignora: já estamos no caminho de recuperação
    }
    memoryStorage.delete(key);
    return null;
  }
};

const readFromStorage = (storageName: BrowserStorageName, key: string) => {
  if (!probeBrowserStorage(storageName)) return null;

  const storage = getBrowserStorage(storageName);
  if (!storage) return null;

  try {
    const value = storage.getItem(key);
    return parseAuthPayload(storageName, storage, key, value);
  } catch (err) {
    console.warn(`[auth:storage] ${storageName}.getItem falhou`, { key, err });
    return null;
  }
};

const writeToStorage = (storageName: BrowserStorageName, key: string, value: string) => {
  if (!probeBrowserStorage(storageName)) return;

  const storage = getBrowserStorage(storageName);
  if (!storage) return;

  try {
    storage.setItem(key, value);
  } catch (err) {
    console.warn(`[auth:storage] ${storageName}.setItem falhou`, { key, err });
  }
};

const removeFromStorage = (storageName: BrowserStorageName, key: string) => {
  if (!probeBrowserStorage(storageName)) return;

  const storage = getBrowserStorage(storageName);
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (err) {
    console.warn(`[auth:storage] ${storageName}.removeItem falhou`, { key, err });
  }
};

export const getAuthStorageDiagnostics = () => ({
  localStorageAvailable: probeBrowserStorage("localStorage"),
  sessionStorageAvailable: probeBrowserStorage("sessionStorage"),
  localAuthKeys: listStorageKeys(getBrowserStorage("localStorage")).filter(isAuthStorageKey),
  sessionAuthKeys: listStorageKeys(getBrowserStorage("sessionStorage")).filter(isAuthStorageKey),
  memoryAuthKeys: Array.from(memoryStorage.keys()).filter(isAuthStorageKey),
});

export const clearStoredAuthArtifacts = (reason: string) => {
  const removedKeys = new Set<string>();

  (["localStorage", "sessionStorage"] as BrowserStorageName[]).forEach((storageName) => {
    const storage = getBrowserStorage(storageName);
    if (!storage) return;

    listStorageKeys(storage)
      .filter(isAuthStorageKey)
      .forEach((key) => {
        removedKeys.add(`${storageName}:${key}`);
        removeFromStorage(storageName, key);
      });
  });

  Array.from(memoryStorage.keys())
    .filter(isAuthStorageKey)
    .forEach((key) => {
      removedKeys.add(`memory:${key}`);
      memoryStorage.delete(key);
    });

  console.warn("[auth:storage] limpando sessão persistida", {
    reason,
    removedKeys: Array.from(removedKeys),
  });
};

const createSafeStorage = () => {
  if (typeof window === "undefined") return undefined;

  const canUseLocal = probeBrowserStorage("localStorage");
  const canUseSession = probeBrowserStorage("sessionStorage");

  return {
    getItem: (key: string) => {
      const localValue = readFromStorage("localStorage", key);
      if (localValue !== null) {
        memoryStorage.set(key, localValue);
        return localValue;
      }

      const sessionValue = readFromStorage("sessionStorage", key);
      if (sessionValue !== null) {
        memoryStorage.set(key, sessionValue);
        if (canUseLocal) {
          writeToStorage("localStorage", key, sessionValue);
          console.info("[auth:storage] sessão restaurada do backup de sessão", {
            key,
            restoredTo: "localStorage",
          });
        }
        return sessionValue;
      }

      return memoryStorage.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
      if (canUseLocal) writeToStorage("localStorage", key, value);
      if (canUseSession) writeToStorage("sessionStorage", key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
      if (canUseLocal) removeFromStorage("localStorage", key);
      if (canUseSession) removeFromStorage("sessionStorage", key);
    },
  };
};

export const supabase: any = supabaseConfig.isConfigured
  ? createClient<Database>(rawUrl, rawPublishableKey, {
      auth: {
        storage: createSafeStorage(),
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        lock: processLock,
      },
    })
  : noopSupabase;
