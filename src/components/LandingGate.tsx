import { Navigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Landing from "@/pages/Landing";

export const LandingGate = () => {
  const { user, loading } = useAuth();

  const isInstalledApp = (() => {
    if (typeof window === "undefined") return false;
    const iosNavigator = window.navigator as Navigator & { standalone?: boolean };
    return window.matchMedia("(display-mode: standalone)").matches || Boolean(iosNavigator.standalone);
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  if (isInstalledApp && !user) {
    console.info("[auth] redirect", { from: "LandingGate", to: "/login", reason: "installed_app_without_user" });
    return <Navigate to="/login" replace />;
  }

  if (isInstalledApp || user) {
    return <Navigate to="/app" replace />;
  }

  return <Landing />;
};

export default LandingGate;
