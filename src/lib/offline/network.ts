/** Estado de rede simples baseado em navigator.onLine + eventos. */
import { useEffect, useState } from "react";

export const isOnline = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

type Listener = (online: boolean) => void;
const listeners = new Set<Listener>();

if (typeof window !== "undefined") {
  window.addEventListener("online", () => listeners.forEach((l) => l(true)));
  window.addEventListener("offline", () => listeners.forEach((l) => l(false)));
}

export function onNetworkChange(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
