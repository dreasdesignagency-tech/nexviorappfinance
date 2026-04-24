import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  const officialOrigin = "https://nexviorappfinance.vercel.app";
  const hasAuthPayload =
    window.location.hash.includes("access_token") ||
    window.location.hash.includes("refresh_token") ||
    window.location.search.includes("code=") ||
    window.location.search.includes("type=");

  if (window.location.hostname.includes("lovable.app") && hasAuthPayload) {
    window.location.replace(`${officialOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
