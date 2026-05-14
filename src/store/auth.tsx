import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  OFFICIAL_HOST,
  redirectToOfficialLocation,
  shouldForceOfficialDomain,
} from "@/lib/auth-urls";
import { startSyncDaemon } from "@/lib/offline/sync";
import { clearUserData } from "@/lib/offline/db";
import { canUseBackend, clearStoredAuthArtifacts, getAuthStorageDiagnostics } from "@/lib/supabase";

const isOnOfficialDomain = () => {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  // Allow local dev hosts to behave normally.
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".local")) {
    return true;
  }
  if (host.includes("lovable.app")) {
    return false;
  }
  return host === OFFICIAL_HOST;
};

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loadingAuth: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const userIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const lastSessionFingerprintRef = useRef<string | null>(null);
  const invalidSessionRecoveryRef = useRef(false);

  useEffect(() => {
    // Daemon de sincronização offline (uma única vez)
    startSyncDaemon(() => userIdRef.current);
  }, []);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    // If we somehow ended up on a non-official domain, bounce immediately.
    if (shouldForceOfficialDomain() || !isOnOfficialDomain()) {
      redirectToOfficialLocation();
      return;
    }

    if (!canUseBackend("auth:init")) {
      setSession(null);
      setUser(null);
      setLoading(false);
      setLoadingAuth(false);
      hydratedRef.current = true;
      return;
    }

    // Diagnóstico Safari/Brave/Opera no macOS: instrumenta signOut global
    // para capturar stack trace de QUALQUER chamada (interna ou externa).
    try {
      const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
      if (!(supabase.auth as any).__signOutInstrumented) {
        (supabase.auth as any).__signOutInstrumented = true;
        supabase.auth.signOut = async (...args: any[]) => {
          console.warn("[auth] supabase.auth.signOut() invocado", {
            args,
            stack: new Error("supabase-signout-trace").stack,
          });
          return originalSignOut(...args);
        };
      }
    } catch (err) {
      console.warn("[auth] não foi possível instrumentar signOut", err);
    }

    // Log de ambiente para diagnóstico Safari/Mac.
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isMac = /Macintosh|Mac OS X/i.test(ua);
      const hasLocks = typeof (navigator as any)?.locks?.request === "function";
      console.info("[auth] ambiente", { isSafari, isMac, hasLocks, ua, storage: getAuthStorageDiagnostics() });
    }

    let mounted = true;

    const fingerprint = (nextSession: Session | null) => {
      if (!nextSession?.access_token || !nextSession?.user?.id) return null;
      return `${nextSession.user.id}:${nextSession.access_token.slice(-12)}`;
    };

    const finishHydration = () => {
      hydratedRef.current = true;
      if (mounted) {
        setLoading(false);
        setLoadingAuth(false);
      }
    };

    const recoverFromInvalidPersistedSession = async (source: string, reason: string) => {
      if (invalidSessionRecoveryRef.current) return;
      invalidSessionRecoveryRef.current = true;

      console.warn("[auth] recover invalid persisted session", {
        source,
        reason,
        lastSessionFingerprint: lastSessionFingerprintRef.current,
        storage: getAuthStorageDiagnostics(),
      });

      clearStoredAuthArtifacts(`${source}:${reason}`);

      try {
        const { data, error } = await supabase.auth.getSession();
        console.info("[auth] getSession after storage cleanup", {
          source,
          hasSession: Boolean(data?.session),
          userId: data?.session?.user?.id ?? null,
          error: error
            ? {
                message: error.message,
                status: (error as any)?.status,
                code: (error as any)?.code,
              }
            : null,
        });
        applyResolvedSession(`${source}:post_cleanup_getSession`, data?.session ?? null);
      } catch (err) {
        console.error("[auth] failed to recover invalid persisted session", { source, reason, err });
        applyResolvedSession(`${source}:post_cleanup_fallback`, null);
      } finally {
        invalidSessionRecoveryRef.current = false;
      }
    };

    const applyResolvedSession = (
      source: string,
      nextSession: Session | null,
      options?: { keepLoading?: boolean; preserveIfHydratingWithoutSession?: boolean },
    ) => {
      if (!mounted) return;
      if (options?.preserveIfHydratingWithoutSession && !hydratedRef.current && !nextSession) {
        console.info("[auth] preservando sessão local durante hidratação", {
          source,
          reason: "hydration_not_finished_and_no_session_payload",
          localUserId: userIdRef.current,
        });
        return;
      }

      lastSessionFingerprintRef.current = fingerprint(nextSession);
      console.info("[auth] state", source, {
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id ?? null,
        hydrated: hydratedRef.current,
      });
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!options?.keepLoading) {
        finishHydration();
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      if (!mounted) return;
      console.info("[auth] event", event, {
        hasSession: Boolean(s),
        userId: s?.user?.id ?? null,
        loadingAuth: !hydratedRef.current,
        lastSessionFingerprint: lastSessionFingerprintRef.current,
      });

      // Eventos que SEMPRE refletem a verdade do servidor sobre a sessão.
      if (event === "INITIAL_SESSION") {
        applyResolvedSession(`event:${event}`, s, {
          keepLoading: true,
          preserveIfHydratingWithoutSession: true,
        });
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Só atualizamos quando há uma sessão válida. Um TOKEN_REFRESHED com
        // sessão nula NÃO deve deslogar o usuário (pode ser uma falha
        // transitória de refresh em Safari/Brave/Opera com storage restrito).
        if (s) {
          applyResolvedSession(`event:${event}`, s);
        } else {
          console.warn("[auth] ignoring event without session (mantendo sessão local)", { event });
          if (hydratedRef.current) {
            setLoading(false);
            setLoadingAuth(false);
          }
        }
        return;
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        const hadPersistedSession = Boolean(lastSessionFingerprintRef.current || userIdRef.current);
        console.warn("[auth] sessão encerrada pelo Supabase", {
          event,
          reason: event === "USER_DELETED" ? "user_deleted" : "explicit_logout_or_revoked_session",
          hadPersistedSession,
          stack: new Error("auth-sign-out-trace").stack,
        });
        if (event === "SIGNED_OUT" && hadPersistedSession) {
          void recoverFromInvalidPersistedSession(`event:${event}`, "signed_out_after_existing_session");
          return;
        }
        applyResolvedSession(`event:${event}`, null);
        return;
      }

      // Qualquer outro evento (ex.: PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED):
      // só atualiza se vier sessão; nunca limpa o usuário sem confirmação.
      if (s) {
        applyResolvedSession(`event:${event}`, s);
      } else {
        console.info("[auth] evento sem sessão — preservando estado local", { event });
        if (hydratedRef.current) {
          setLoading(false);
          setLoadingAuth(false);
        }
      }
    });

    // Restore session after the listener is attached so ProtectedRoute doesn't
    // race against auth hydration and bounce the user back to /login.
    console.info("[auth] getSession start", {
      source: "AuthProvider:init",
      storage: getAuthStorageDiagnostics(),
    });

    supabase.auth.getSession().then(({ data: { session: s }, error }: any) => {
      if (!mounted) return;
      if (error) {
        console.warn("[auth] getSession error (mantendo sessão local se houver)", {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        });
        const authMessage = String(error?.message ?? "").toLowerCase();
        const authCode = String(error?.code ?? "").toLowerCase();
        const shouldClearPersistedSession =
          authMessage.includes("refresh token") ||
          authMessage.includes("jwt") ||
          authMessage.includes("invalid") ||
          authMessage.includes("session") ||
          authCode.includes("refresh") ||
          authCode.includes("jwt") ||
          authCode.includes("session");

        if (shouldClearPersistedSession) {
          void recoverFromInvalidPersistedSession("getSession", `auth_error:${error?.message ?? error?.code ?? "unknown"}`);
          return;
        }
      }
      applyResolvedSession("getSession", s, {
        preserveIfHydratingWithoutSession: true,
      });
      finishHydration();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const uid = userIdRef.current;
    console.info("[auth] signOut chamado", {
      userId: uid,
      stack: new Error("signout-trace").stack,
    });
    if (!canUseBackend("auth:signOut", { silent: true })) {
      if (uid) await clearUserData(uid);
      setSession(null);
      setUser(null);
      return;
    }
    await supabase.auth.signOut();
    if (uid) await clearUserData(uid);
  };

  return (
    <Ctx.Provider value={{ user, session, loading, loadingAuth, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};
