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
import { canUseBackend } from "@/lib/supabase";

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
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

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
      return;
    }

    let mounted = true;

    const applyResolvedSession = (
      source: string,
      nextSession: Session | null,
      options?: { keepLoading?: boolean },
    ) => {
      if (!mounted) return;
      console.info("[auth] state", source, {
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id ?? null,
      });
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!options?.keepLoading) {
        setLoading(false);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      if (!mounted) return;
      console.info("[auth] event", event, {
        hasSession: Boolean(s),
        userId: s?.user?.id ?? null,
      });

      // Eventos que SEMPRE refletem a verdade do servidor sobre a sessão.
      if (event === "INITIAL_SESSION") {
        applyResolvedSession(`event:${event}`, s, { keepLoading: true });
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
          setLoading(false);
        }
        return;
      }

      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        console.warn("[auth] sessão encerrada pelo Supabase", {
          event,
          reason: event === "USER_DELETED" ? "user_deleted" : "explicit_logout_or_revoked_session",
          stack: new Error("auth-sign-out-trace").stack,
        });
        applyResolvedSession(`event:${event}`, null);
        return;
      }

      // Qualquer outro evento (ex.: PASSWORD_RECOVERY, MFA_CHALLENGE_VERIFIED):
      // só atualiza se vier sessão; nunca limpa o usuário sem confirmação.
      if (s) {
        applyResolvedSession(`event:${event}`, s);
      } else {
        console.info("[auth] evento sem sessão — preservando estado local", { event });
        setLoading(false);
      }
    });

    // Restore session after the listener is attached so ProtectedRoute doesn't
    // race against auth hydration and bounce the user back to /login.
    supabase.auth.getSession().then(({ data: { session: s }, error }: any) => {
      if (!mounted) return;
      if (error) {
        console.warn("[auth] getSession error (mantendo sessão local se houver)", {
          message: error?.message,
          status: error?.status,
          code: error?.code,
        });
      }
      applyResolvedSession("getSession", s);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const uid = userIdRef.current;
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
    <Ctx.Provider value={{ user, session, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside AuthProvider");
  return v;
};
