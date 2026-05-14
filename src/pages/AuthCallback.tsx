import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { getAuthStorageDiagnostics } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finalize = async () => {
      // After confirming email / OAuth, send user to landing planos section.
      // ProtectedRoute / sign-in flows handle access checks elsewhere.
      const goNext = () => {
        console.info("[auth] redirect", {
          from: "AuthCallback",
          to: "/lp#planos",
          reason: "auth_callback_success",
          storage: getAuthStorageDiagnostics(),
        });
        navigate("/lp#planos", { replace: true });
      };
      try {
        const search = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        console.info("[auth] callback start", {
          hasCode: Boolean(search.get("code")),
          hasTokenHash: Boolean(search.get("token_hash") || hashParams.get("token_hash")),
          hasAccessToken: Boolean(hashParams.get("access_token")),
          hasRefreshToken: Boolean(hashParams.get("refresh_token")),
          storage: getAuthStorageDiagnostics(),
        });

        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          goNext();
          return;
        }

        const tokenHash = search.get("token_hash") || hashParams.get("token_hash");
        const type = (search.get("type") || hashParams.get("type")) as any;
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          goNext();
          return;
        }

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          goNext();
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          goNext();
          return;
        }

        console.info("[auth] redirect", {
          from: "AuthCallback",
          to: "/auth",
          reason: "callback_without_session",
          storage: getAuthStorageDiagnostics(),
        });
        navigate("/auth", { replace: true });
      } catch (err) {
        console.error("[AuthCallback]", err);
        console.info("[auth] redirect", {
          from: "AuthCallback",
          to: "/auth",
          reason: "callback_exception",
          storage: getAuthStorageDiagnostics(),
        });
        navigate("/auth", { replace: true });
      }
    };

    finalize();
  }, [navigate]);

  return null;
};

export default AuthCallback;
