import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { isBackendConfigured } from "@/lib/backend-guard";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, loadingAuth } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  const isAuthRoute = location.pathname === "/auth" || location.pathname === "/login" || location.pathname === "/cadastro";

  if (!isBackendConfigured()) {
    return <>{children}</>;
  }

  if (loading || loadingAuth || (user && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (!user) {
    console.info("[auth] protected-route redirect", {
      reason: "missing_user_after_auth_ready",
      returnTo,
      isAuthRoute,
      loading,
      loadingAuth,
      subLoading,
    });
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }

  if (!hasAccess) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};
