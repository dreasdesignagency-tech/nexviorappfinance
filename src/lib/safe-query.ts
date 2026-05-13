import { toast } from "sonner";

type SupaError = {
  message?: string;
  code?: string;
  status?: number | string;
  details?: string;
  hint?: string;
} | null | undefined;

export type ErrorKind =
  | "auth"
  | "rate_limit"
  | "rls"
  | "schema"
  | "network"
  | "unknown";

export const classifyError = (error: SupaError): ErrorKind => {
  if (!error) return "unknown";
  const msg = (error.message || "").toLowerCase();
  const code = String(error.code || "").toUpperCase();
  const status = Number(error.status);

  if (status === 401 || msg.includes("jwt") || msg.includes("invalid_grant") || msg.includes("not authenticated")) return "auth";
  if (status === 429 || msg.includes("rate limit") || msg.includes("too many")) return "rate_limit";
  if (status === 403 || msg.includes("row-level security") || msg.includes("policy")) return "rls";
  if (code.startsWith("PGRST") && (msg.includes("does not exist") || msg.includes("column") || msg.includes("relation"))) return "schema";
  if (status === 404 || msg.includes("does not exist") || msg.includes("relation") || msg.includes("column")) return "schema";
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("timeout")) return "network";
  return "unknown";
};

const friendlyMessage = (entity: string, kind: ErrorKind): string => {
  switch (kind) {
    case "rate_limit":
      return `Muitas requisições no momento. Tentaremos carregar ${entity} novamente em instantes.`;
    case "network":
      return `Sem conexão para carregar ${entity}. Verifique sua internet.`;
    case "rls":
      return `Sem permissão para acessar ${entity}.`;
    case "schema":
      return `Não foi possível ler ${entity} (estrutura indisponível).`;
    case "auth":
      return `Sessão expirando, tentando reconectar para ${entity}.`;
    default:
      return `Não foi possível carregar ${entity} agora.`;
  }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface SafeQueryOptions {
  entity: string;
  retries?: number;
  showToast?: boolean;
}

/**
 * Executes a Supabase query with retries (for transient errors only),
 * detailed logging, and graceful fallback. Never throws and never logs out.
 */
export async function safeQuery<T>(
  fn: () => Promise<{ data: T | null; error: SupaError }>,
  options: SafeQueryOptions,
): Promise<{ data: T | null; error: SupaError; kind: ErrorKind | null }> {
  const { entity, retries = 2, showToast = true } = options;
  let lastErr: SupaError = null;
  let lastKind: ErrorKind | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      if (!result.error) {
        return { data: result.data, error: null, kind: null };
      }
      lastErr = result.error;
      lastKind = classifyError(result.error);
      console.error(`[safeQuery:${entity}] attempt ${attempt + 1} failed`, {
        kind: lastKind,
        message: result.error?.message,
        code: result.error?.code,
        status: result.error?.status,
        details: result.error?.details,
        hint: result.error?.hint,
      });

      // Retry only transient errors
      if (lastKind === "rate_limit" || lastKind === "network") {
        if (attempt < retries) {
          await sleep(500 * Math.pow(2, attempt));
          continue;
        }
      }
      break;
    } catch (err: any) {
      lastErr = { message: err?.message || String(err) };
      lastKind = classifyError(lastErr);
      console.error(`[safeQuery:${entity}] threw`, err);
      if (attempt < retries && (lastKind === "network" || lastKind === "unknown")) {
        await sleep(500 * Math.pow(2, attempt));
        continue;
      }
      break;
    }
  }

  if (showToast && lastKind) {
    toast.error(friendlyMessage(entity, lastKind));
  }
  return { data: null, error: lastErr, kind: lastKind };
}
