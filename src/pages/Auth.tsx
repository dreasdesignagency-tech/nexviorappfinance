import { useEffect, useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/auth-urls";
import { useAuth } from "@/store/auth";
import { requireBackend } from "@/lib/backend-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail } from "lucide-react";
import { Logo } from "@/components/Logo";

const signUpSchema = z
  .object({
    full_name: z.string().trim().min(2, "Informe seu nome completo").max(100),
    email: z.string().trim().email("E-mail inválido").max(255),
    phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });

const signInSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

type Mode = "signin" | "signup";

const Auth = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/app";
  const [mode, setMode] = useState<Mode>("signin");
  const [busy, setBusy] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = mode === "signin" ? "Entrar — Nexvior" : "Criar conta — Nexvior";
  }, [mode]);

  if (loading) return null;
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireBackend("auth:signin")) return;
    setErrors({});
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (f[String(i.path[0])] = i.message));
      setErrors(f);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        toast.error("Confirme seu e-mail antes de entrar.");
      } else {
        toast.error("E-mail ou senha incorretos.");
      }
      return;
    }
    toast.success("Bem-vindo de volta!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireBackend("auth:signup")) return;
    setErrors({});
    const parsed = signUpSchema.safeParse({ full_name: fullName, email, phone, password, confirm });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (f[String(i.path[0])] = i.message));
      setErrors(f);
      return;
    }
    setBusy(true);
    const authCallbackUrl = getAuthCallbackUrl();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: authCallbackUrl,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
        },
      },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
        toast.error("Este e-mail já está cadastrado.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Seu acesso foi criado, entre e escolha o plano ideal para você");
    setMode("signin");
  };

  const handleGoogle = async () => {
    if (!requireBackend("auth:google")) return;
    setBusy(true);
    const authCallbackUrl = getAuthCallbackUrl();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl,
      },
    });
    if (error) {
      setBusy(false);
      toast.error("Não foi possível entrar com o Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-primary/5">
      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 glow-primary mb-5 p-3.5">
            <Logo className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Entrar na sua conta" : "Criar uma conta"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin"
              ? "Continue acompanhando suas finanças"
              : "Comece a organizar suas finanças hoje"}
          </p>
        </div>

        <div className="glass-card p-6 md:p-7">
          {mode === "signup" ? (
            <form onSubmit={handleSignUp} className="space-y-3">
              <Field id="full_name" label="Nome completo" value={fullName} onChange={setFullName} error={errors.full_name} autoComplete="name" />
              <Field id="email" type="email" label="E-mail" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
              <Field id="phone" label="Telefone" value={phone} onChange={setPhone} error={errors.phone} autoComplete="tel" placeholder="(11) 99999-9999" />
              <Field id="password" type="password" label="Senha" value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />
              <Field id="confirm" type="password" label="Confirmar senha" value={confirm} onChange={setConfirm} error={errors.confirm} autoComplete="new-password" />
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow glow-primary mt-2" disabled={busy}>
                {busy ? "Criando…" : "Criar conta"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-3">
              <Field id="email" type="email" label="E-mail" value={email} onChange={setEmail} error={errors.email} autoComplete="email" />
              <Field id="password" type="password" label="Senha" value={password} onChange={setPassword} error={errors.password} autoComplete="current-password" />
              <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-primary-glow glow-primary mt-2" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? (
              <>
                Ainda não tem conta?{" "}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => { setMode("signup"); setErrors({}); }}>
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button type="button" className="text-primary hover:underline font-medium" onClick={() => { setMode("signin"); setErrors({}); }}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
          <Mail className="w-3 h-3" />
          Confirmação por e-mail necessária após o cadastro
        </p>
      </main>
    </div>
  );
};

const Field = ({
  id, label, value, onChange, error, type = "text", autoComplete, placeholder,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; autoComplete?: string; placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete={autoComplete}
      placeholder={placeholder}
      className="h-11"
    />
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default Auth;
