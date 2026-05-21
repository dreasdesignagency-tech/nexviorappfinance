import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/store/profile";
import { useAuth } from "@/store/auth";

/**
 * Blocks access to the app until the user has filled in nome + telefone.
 * Redirects to /completar-perfil otherwise.
 */
export const ProfileCompletionGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const location = useLocation();

  if (!user) return <>{children}</>;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  const isComplete =
    (profile.nome?.trim().length ?? 0) >= 2 && (profile.telefone?.trim().length ?? 0) >= 8;

  if (!isComplete && location.pathname !== "/completar-perfil") {
    return <Navigate to="/completar-perfil" replace />;
  }

  return <>{children}</>;
};
