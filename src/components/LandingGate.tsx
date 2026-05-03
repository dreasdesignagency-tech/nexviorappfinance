import { Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Landing from "@/pages/Landing";

export const LandingGate = () => {
  const { user, loading } = useAuth();

  const isInstalledApp = (() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || Boolean(window.navigator.standalone);
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (isInstalledApp) {
    return <Navigate to="/app" replace />;
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Landing />;
};

export default LandingGate;
