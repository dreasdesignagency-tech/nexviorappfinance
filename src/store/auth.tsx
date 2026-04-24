import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const OFFICIAL_APP_URL = "https://nexviorappfinance.vercel.app";

const shouldForceOfficialRedirect = () => {
  if (typeof window === "undefined") return false;

  const hasAuthParams = Boolean(
    window.location.hash.includes("access_token") ||
      window.location.hash.includes("refresh_token") ||
      window.location.search.includes("code=") ||
      window.location.search.includes("type=")
  );

  return window.location.hostname.includes("lovable.app") && hasAuthParams;
};

const redirectToOfficialDomain = () => {
  if (typeof window === "undefined") return;
  const targetUrl = `${OFFICIAL_APP_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(targetUrl);
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

  useEffect(() => {
    if (shouldForceOfficialRedirect()) {
      redirectToOfficialDomain();
      return;
    }

    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (
        s?.user &&
        ["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event) &&
        typeof window !== "undefined" &&
        window.location.hostname !== new URL(OFFICIAL_APP_URL).hostname
      ) {
        redirectToOfficialDomain();
      }
    });

    // Then existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (
        s?.user &&
        typeof window !== "undefined" &&
        window.location.hostname !== new URL(OFFICIAL_APP_URL).hostname
      ) {
        redirectToOfficialDomain();
        return;
      }

      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
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
