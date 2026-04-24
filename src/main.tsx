import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Hard guard: if the user lands on any non-official domain (e.g. legacy
// .lovable.app preview/published URLs) we immediately bounce to the
// official Vercel domain. Runs BEFORE React mounts so the user never
// visually sees the wrong domain.
if (typeof window !== "undefined") {
  const OFFICIAL_ORIGIN = "https://nexviorappfinance.vercel.app";
  const currentHost = window.location.hostname;

  const isLocal =
    currentHost === "localhost" ||
    currentHost === "127.0.0.1" ||
    currentHost.endsWith(".local");

  if (!isLocal && currentHost.includes("lovable.app")) {
    window.location.replace(OFFICIAL_ORIGIN);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
