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
    <div className="relative min-h-screen overflow-hidden bg-[#070711] text-foreground flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute bottom-0 -right-40 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />
      </div>

      <main className="relative z-10 w-full max-w-md">
        <Link
          to="/founder"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-300/20 to-amber-500/10 border border-amber-300/30 mb-4 p-3 shadow-[0_0_40px_-10px_rgba(251,191,36,0.6)]">
            <Logo className="w-full h-full" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-300/10 border border-amber-300/40 text-amber-200 text-[11px] font-semibold mb-3">
            <Crown className="w-3 h-3" />
            Founder Access
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Crie sua conta gratuita</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Acesso premium completo, sem cobrança.
          </p>
        </motion.div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 md:p-7">
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
              className="w-full h-12 mt-2 rounded-xl font-semibold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-[#1a1200] hover:from-amber-200 hover:to-amber-400 shadow-[0_10px_30px_-10px_rgba(251,191,36,0.7)]"
            >
              {busy ? "Criando…" : "Criar conta Founder"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-5">
            Já tem conta?{" "}
            <Link to="/login" className="text-amber-200 hover:underline font-medium">
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
