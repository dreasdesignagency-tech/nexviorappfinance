import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, Crown, ArrowRight, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/auth";

interface LaunchStatus {
  is_open: boolean;
  max_slots: number | null;
  total: number;
}

const FounderLanding = () => {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<LaunchStatus | null>(null);

  useEffect(() => {
    document.title = "Acesso Antecipado — Nexvior Founder";
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "Entre gratuitamente no Nexvior. Acesso antecipado liberado por tempo limitado para os primeiros Founders.",
    );
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("public_launch_status" as any);
      if (data) setStatus(data as LaunchStatus);
    })();
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/app" replace />;
  }

  const closed = status && (!status.is_open || (status.max_slots !== null && status.total >= status.max_slots));
  const slotsLeft =
    status?.max_slots !== null && status?.max_slots !== undefined
      ? Math.max(status.max_slots - status.total, 0)
      : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070711] text-foreground">
      {/* ambient gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-400/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-primary/15 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[140px]" />
      </div>

      <header className="relative z-10 px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <span className="font-semibold tracking-tight">Nexvior</span>
        </Link>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Já tenho conta
        </Link>
      </header>

      <main className="relative z-10 px-6 pt-8 pb-24 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 backdrop-blur-md text-amber-200 text-xs font-semibold mb-8 shadow-[0_0_30px_-8px_rgba(251,191,36,0.6)]"
        >
          <Crown className="w-3.5 h-3.5" />
          Founder Access · Lançamento
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] text-balance"
        >
          Entre gratuitamente no{" "}
          <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
            Nexvior
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-5 text-base md:text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Acesso antecipado liberado por tempo limitado. Organize sua vida financeira com uma experiência premium,
          moderna e inteligente.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          {closed ? (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              Vagas esgotadas. Volte em breve.
            </div>
          ) : (
            <Link to="/founder/cadastro">
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-[#1a1200] hover:from-amber-200 hover:to-amber-400 shadow-[0_10px_40px_-10px_rgba(251,191,36,0.7)]"
              >
                Criar conta grátis
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          )}

          {slotsLeft !== null && !closed && (
            <p className="text-xs text-muted-foreground">
              <span className="text-amber-200 font-semibold">{slotsLeft}</span> vagas restantes
            </p>
          )}
        </motion.div>

        {/* perks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[
            { icon: Crown, title: "Selo Founder", desc: "Reconhecimento permanente como membro inicial." },
            { icon: Sparkles, title: "Acesso Premium", desc: "Todos os recursos liberados desde o primeiro dia." },
            { icon: Check, title: "Sem cobrança", desc: "Não precisa cartão. Sem fidelidade. Sem pegadinha." },
          ].map((perk, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 text-left hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-300/10 border border-amber-300/30 flex items-center justify-center mb-3">
                <perk.icon className="w-5 h-5 text-amber-200" />
              </div>
              <p className="font-semibold text-sm">{perk.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{perk.desc}</p>
            </div>
          ))}
        </motion.div>

        <p className="mt-12 text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} Nexvior · Acesso antecipado por tempo limitado
        </p>
      </main>
    </div>
  );
};

export default FounderLanding;
