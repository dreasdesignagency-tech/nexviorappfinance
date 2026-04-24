import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const OFFICIAL_APP_URL = "https://nexviorappfinance.vercel.app";
const OFFICIAL_HOST = new URL(OFFICIAL_APP_URL).hostname;

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

const redirectToOfficialDomain = () => {
  if (typeof window === "undefined") return;
  window.location.replace(OFFICIAL_APP_URL);
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
    // If we somehow ended up on a non-official domain, bounce immediately.
    if (!isOnOfficialDomain()) {
      redirectToOfficialDomain();
      return;
    }

    // Listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    // Then existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
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
