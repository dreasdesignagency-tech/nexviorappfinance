import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { redirectToOfficialLocation, shouldForceOfficialDomain } from "@/lib/auth-urls";

type Status = "loading" | "error";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const finalize = async () => {
      try {
        if (shouldForceOfficialDomain()) {
          redirectToOfficialLocation("/auth/callback", window.location.search, window.location.hash);
          return;
        }

        const search = new URLSearchParams(window.location.search);
        // Supabase pode retornar parâmetros no hash (#access_token=...) ou na query (?code=... / ?token_hash=...)
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);

        const errorDescription =
          search.get("error_description") || hashParams.get("error_description");
        if (errorDescription) {
          throw new Error(errorDescription);
        }

        // 1) Fluxo PKCE / OAuth: ?code=...
        const code = search.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          navigate("/app", { replace: true });
          return;
        }

        // 2) Fluxo de confirmação por e-mail / magic link: ?token_hash=...&type=...
        const tokenHash = search.get("token_hash") || hashParams.get("token_hash");
        const type = (search.get("type") || hashParams.get("type")) as
          | "signup"
          | "magiclink"
          | "recovery"
          | "invite"
          | "email_change"
          | "email"
          | null;

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any,
          });
          if (error) throw error;
          navigate("/app", { replace: true });
          return;
        }

        // 3) Fluxo legado com tokens no hash (#access_token=...&refresh_token=...)
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          navigate("/app", { replace: true });
          return;
        }

        // 4) Sessão já existente
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate("/app", { replace: true });
          return;
        }

        throw new Error("Link de confirmação inválido ou expirado.");
      } catch (err: any) {
        console.error("[AuthCallback] erro ao confirmar:", err);
        setErrorMessage(err?.message || "Erro desconhecido");
        setStatus("error");
      }
    };

    finalize();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>

        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Confirmando sua conta...
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Aguarde enquanto validamos seus dados com segurança.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Erro ao confirmar conta
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMessage || "Tente novamente."}
            </p>
            <Button
              className="mt-6 w-full"
              onClick={() => navigate("/auth", { replace: true })}
            >
              Voltar para login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
