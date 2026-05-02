import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finalize = async () => {
      try {

        const search = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/", { replace: true });
          return;
        }

        const tokenHash = search.get("token_hash") || hashParams.get("token_hash");
        const type = (search.get("type") || hashParams.get("type")) as any;
        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
          navigate("/", { replace: true });
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
          navigate("/", { replace: true });
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/", { replace: true });
          return;
        }

        navigate("/auth", { replace: true });
      } catch (err) {
        console.error("[AuthCallback]", err);
        navigate("/auth", { replace: true });
      }
    };

    finalize();
  }, [navigate]);

  return null;
};

export default AuthCallback;
