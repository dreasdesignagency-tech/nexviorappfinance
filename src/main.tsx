import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { redirectToOfficialLocation, shouldForceOfficialDomain } from "@/lib/auth-urls";

// Hard guard: if the user lands on any non-official domain (e.g. legacy
// .lovable.app preview/published URLs) we immediately bounce to the
// official Vercel domain. Runs BEFORE React mounts so the user never
// visually sees the wrong domain.
if (typeof window !== "undefined") {
  if (shouldForceOfficialDomain()) {
    redirectToOfficialLocation();
  }
}

createRoot(document.getElementById("root")!).render(<App />);
