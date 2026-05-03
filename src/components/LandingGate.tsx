import { Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Landing from "@/pages/Landing";

export const LandingGate = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Landing />;
};

export default LandingGate;
