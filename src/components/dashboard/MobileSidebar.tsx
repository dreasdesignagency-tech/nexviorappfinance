import { useState } from "react";
import { Home, ArrowLeftRight, CreditCard, Repeat, Sparkles, Target, PiggyBank, TrendingUp, HeartPulse, LogOut, Menu, Headphones, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useProfile } from "@/store/profile";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/Logo";

const items = [
  { icon: Home, label: "Dashboard", to: "/app" },
  { icon: ArrowLeftRight, label: "Transações", to: "/transacoes" },
  { icon: CreditCard, label: "Cartões", to: "/cartoes" },
  { icon: Repeat, label: "Parcelas & Assinaturas", to: "/recorrentes" },
  { icon: Target, label: "Orçamento", to: "/orcamento" },
  { icon: PiggyBank, label: "Metas", to: "/metas" },
  { icon: TrendingUp, label: "Investimentos", to: "/investimentos" },
  { icon: HeartPulse, label: "Saúde Financeira", to: "/saude-financeira" },
  { icon: Sparkles, label: "Nex.ia", to: "/nex-ia" },
];

interface MobileSidebarProps {
  className?: string;
}

export const MobileSidebar = ({ className }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const initial = profile.nome.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    toast.success("Você saiu da conta.");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 h-11 rounded-xl transition-all duration-300 text-sm font-medium",
      isActive
        ? "bg-primary/15 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)] border border-primary/30"
        : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/60 border border-transparent"
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Abrir menu"
          className={cn(
            "md:hidden w-9 h-9 rounded-full glass-inner flex items-center justify-center text-foreground shrink-0",
            className
          )}
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[280px] border-r border-border/50 bg-background shadow-2xl"
        style={{ paddingTop: "var(--safe-top)", paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="h-full w-full flex flex-col py-6 px-4 gap-2 bg-gradient-to-b from-surface/80 to-background">
          <div className="flex items-center gap-2.5 px-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 p-1.5">
              <Logo className="w-full h-full" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-foreground">Nexvior</p>
              <p className="text-[10px] text-muted-foreground">Painel de riqueza</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={i}
                  to={item.to}
                  end={item.to === "/app"}
                  className={navClass}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-border/40">
            <a
              href="https://wa.me/55991932458?text=Preciso%20de%20suporte"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-all border border-transparent hover:border-primary/20"
            >
              <Headphones className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">Suporte</span>
            </a>
            <a
              href="https://wa.me/55991932458?text=Quero%20o%20Nexvior%20na%20minha%20empresa"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_20px_hsl(var(--primary)/0.25)] transition-all border border-transparent hover:border-primary/20 mb-1"
            >
              <Building2 className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">Nexvior para Empresa</span>
            </a>
            <NavLink
              to="/perfil"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-2 h-12 rounded-xl transition-all",
                  isActive ? "bg-surface-elevated/70" : "hover:bg-surface-elevated/50"
                )
              }
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent ring-2 ring-border flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden shrink-0">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.nome} className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="leading-tight min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{profile.nome}</p>
                <p className="text-[10px] text-muted-foreground truncate">Perfil</p>
              </div>
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition border border-transparent"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
