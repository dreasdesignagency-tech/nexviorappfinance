import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

// SHA-256 hash of the master password — the plaintext is NEVER in the bundle.
const PASSWORD_HASH = "6f6fed04ae9cce57e9c8b64e9f0afc1874b73957777679771e900e56d87f0d21";
const STORAGE_KEY = "admin_gate_unlocked_until";
const TTL_MS = 30 * 60 * 1000; // 30 min

const sha256Hex = async (text: string) => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

export const AdminPasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pwd, setPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const until = Number(sessionStorage.getItem(STORAGE_KEY) || 0);
    if (until > Date.now()) setUnlocked(true);
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const hash = await sha256Hex(pwd);
      if (hash === PASSWORD_HASH) {
        sessionStorage.setItem(STORAGE_KEY, String(Date.now() + TTL_MS));
        setUnlocked(true);
        toast.success("Acesso liberado");
      } else {
        toast.error("Senha incorreta");
        setPwd("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-sm p-6 space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">Área restrita</h1>
          <p className="text-xs text-muted-foreground">
            Digite a senha mestra para continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Senha"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" className="w-full" disabled={!pwd || submitting}>
            {submitting ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </Card>
    </div>
  );
};
