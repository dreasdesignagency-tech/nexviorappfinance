import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { useProfile } from "@/store/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(100),
  telefone: z.string().trim().min(8, "Informe um telefone válido").max(30),
});

const CompletarPerfil = () => {
  const { user, loading, loadingAuth } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Completar cadastro — Nexvior";
  }, []);

  useEffect(() => {
    if (profile.nome) setNome(profile.nome);
    if (profile.telefone) setTelefone(profile.telefone);
  }, [profile.nome, profile.telefone]);

  if (loading || loadingAuth) return null;
  if (!user) return <Navigate to="/login" replace />;

  const isComplete = (profile.nome?.trim().length ?? 0) >= 2 && (profile.telefone?.trim().length ?? 0) >= 8;
  if (!profileLoading && isComplete) return <Navigate to="/app" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ nome, telefone });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (f[String(i.path[0])] = i.message));
      setErrors(f);
      return;
    }
    setBusy(true);
    try {
      await updateProfile({ nome: parsed.data.nome, telefone: parsed.data.telefone });
      toast.success("Cadastro completo!");
      navigate("/app", { replace: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 glow-primary mb-5 p-3.5">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Complete seu cadastro</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Precisamos do seu nome e telefone para liberar o acesso ao Nexvior.
          </p>
        </div>

        <div className="glass-card p-6 md:p-7">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" className="h-11" />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone / WhatsApp</Label>
              <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} autoComplete="tel" placeholder="(11) 99999-9999" className="h-11" />
              {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
            </div>
            <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow glow-primary mt-2" disabled={busy || profileLoading}>
              {busy ? "Salvando…" : "Continuar"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CompletarPerfil;
