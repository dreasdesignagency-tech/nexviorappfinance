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

    // Restore session from storage first so route guards don't briefly think
    // the user is logged out when the app regains focus.
    supabase.auth.getSession().then(({ data: { session: s }, error }: any) => {
      if (!mounted) return;
      if (error) {
        console.warn("[auth] getSession error (mantendo sessão local se houver)", error);
      }
      console.info("[auth] init", { hasSession: Boolean(s), userId: s?.user?.id ?? null });
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event: string, s: Session | null) => {
      if (!mounted) return;
      console.info("[auth] event", event, { hasSession: Boolean(s), userId: s?.user?.id ?? null });
      // Only clear local user state on explicit auth events. Transient errors
      // (network/query/rate-limit) do NOT trigger onAuthStateChange, so this
      // listener is safe — it fires only for real auth lifecycle events.
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
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
