import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Crown, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";
import { getAuthCallbackUrl } from "@/lib/auth-urls";

const schema = z
  .object({
    full_name: z.string().trim().min(2, "Informe seu nome completo").max(100),
    email: z.string().trim().email("E-mail inválido").max(255),
    phone: z.string().trim().min(8, "Informe um WhatsApp válido").max(30),
    password: z.string().min(8, "A senha deve ter ao menos 8 caracteres").max(72),
  });

const FounderSignup = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    document.title = "Criar conta Founder — Nexvior";
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ full_name: fullName, email, phone, password });
    if (!parsed.success) {
      const f: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (f[String(i.path[0])] = i.message));
      setErrors(f);
      return;
    }
    setBusy(true);
    const callbackUrl = `${getAuthCallbackUrl()}?source=founder`;
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: callbackUrl,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          signup_source: "instagram_launch",
        },
      },
    });
    if (error) {
      setBusy(false);
      if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("user already")) {
        toast.error("Este e-mail já está cadastrado. Faça login.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    // If session was created immediately (auto-confirm), register founder now.
    if (data.session) {
      const { data: regData, error: regErr } = await supabase.rpc("register_founder_user" as any, {
        p_source: "instagram_launch",
      });
      if (regErr) {
        console.warn("[founder] register_founder_user error", regErr.message);
      } else {
        console.info("[founder] registered", regData);
      }
      setBusy(false);
      toast.success("Bem-vindo, Founder! 👑");
      navigate("/app", { replace: true });
      return;
    }

    setBusy(false);
    toast.success("Conta criada! Verifique seu e-mail para confirmar e entrar.");
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-primary-glow/20 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[160px]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <Link
          to="/founder"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 mb-4 p-3 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.7)]">
            <Logo className="w-full h-full" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--primary-glow)/0.12))] border border-primary/40 text-primary text-[11px] font-semibold mb-3 shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(var(--foreground)/0.08)]">
            <Crown className="w-3 h-3" />
            Founder Access
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Crie sua conta gratuita</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Acesso premium completo, sem cobrança.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-[hsl(var(--glass-border)/0.45)] bg-foreground/[0.04] backdrop-blur-xl p-6 md:p-7 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.06),0_8px_32px_-12px_hsl(var(--primary)/0.25)]">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className="h-11" />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="h-11" />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">WhatsApp</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="(11) 99999-9999" className="h-11" />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="h-11" />
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>
            <Button
              type="submit"
              disabled={busy}
              className="w-full h-12 mt-2 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:opacity-95 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.8),0_0_0_1px_hsl(var(--primary)/0.4)_inset]"
            >
              {busy ? "Criando…" : "Criar conta Founder"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/70 mt-6">
          Seu acesso é gratuito durante o lançamento. Sem cartão, sem fidelidade.
        </p>
      </main>
    </div>
  );
};

export default FounderSignup;
