import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo-nexvior.png";
import { useAuth } from "@/store/auth";
import { useSubscription } from "@/hooks/useSubscription";

export const LandingNav = () => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();

  const ctaLabel = !user ? "Entrar" : hasAccess ? "Acessar app" : "Ver planos";
  const handleCta = () => {
    close();
    if (!user) navigate("/auth");
    else if (hasAccess) navigate("/");
    else navigate("/planos");
  };
  const disabled = authLoading || (!!user && subLoading);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/10 bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="container mx-auto px-4 md:px-6 py-2 md:py-2.5">
        <div className="relative flex items-center justify-between h-10 md:h-11">
          <Link
            to="/lp"
            className="flex items-center gap-2 z-10"
            onClick={(e) => {
              close();
              if (window.location.pathname === "/lp") {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <img
              src={logo}
              alt="Nexvior"
              className="h-5 md:h-6 w-auto object-contain [filter:brightness(0)_invert(1)]"
            />
            <span className="text-foreground font-semibold tracking-tight text-sm md:text-base">Nexvior</span>
          </Link>

          <div className="hidden md:flex items-center gap-10 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <a href="#recursos" className="text-sm text-foreground/80 hover:text-neon transition-colors">Recursos</a>
            <a href="#nexia" className="text-sm text-foreground/80 hover:text-neon transition-colors">nex.ia</a>
            <a href="#beneficios" className="text-sm text-foreground/80 hover:text-neon transition-colors">Benefícios</a>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={handleCta}
            className="hidden md:inline-flex h-8 px-4 text-xs font-medium border-foreground/15 bg-transparent hover:bg-neon hover:border-neon hover:text-white transition-all z-10"
          >
            {ctaLabel}
          </Button>

          <button
            className="md:hidden text-foreground p-1.5 -mr-1.5 z-10"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden mt-3 pt-4 pb-2 border-t border-border/10 flex flex-col gap-1">
            <a href="#recursos" onClick={close} className="text-foreground hover:text-neon transition-colors py-3 px-2">Recursos</a>
            <a href="#nexia" onClick={close} className="text-foreground hover:text-neon transition-colors py-3 px-2">nex.ia</a>
            <a href="#beneficios" onClick={close} className="text-foreground hover:text-neon transition-colors py-3 px-2">Benefícios</a>
            <Button
              variant="outline"
              disabled={disabled}
              onClick={handleCta}
              className="w-full mt-2 border-foreground/20 hover:bg-neon hover:border-neon hover:text-white transition-all"
            >
              {ctaLabel}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNav;
