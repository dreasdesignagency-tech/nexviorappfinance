import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const location = useLocation();

  if (loading || (user && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!hasAccess) {
    return <Navigate to="/planos" replace />;
  }

  return <>{children}</>;
};
