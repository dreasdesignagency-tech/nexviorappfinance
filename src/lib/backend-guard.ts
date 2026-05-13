import { toast } from "sonner";
import { canUseBackend, getBackendUnavailableMessage, supabaseConfig } from "@/lib/supabase";

const shownScopes = new Set<string>();

export const requireBackend = (scope: string, options?: { toastMessage?: string; silent?: boolean }) => {
  const available = canUseBackend(scope, { silent: options?.silent });
  if (available) return true;

  if (!options?.silent && !shownScopes.has(scope)) {
    toast.info(options?.toastMessage ?? getBackendUnavailableMessage(scope));
    shownScopes.add(scope);
  }

  return false;
};

export const isBackendConfigured = () => supabaseConfig.isConfigured;
