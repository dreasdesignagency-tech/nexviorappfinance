import { Home, ArrowLeftRight, CreditCard, Repeat, Sparkles, Target, PiggyBank, TrendingUp, HeartPulse, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { useProfile } from "@/store/profile";
import { useAuth } from "@/store/auth";
import { toast } from "sonner";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { MobileBottomNav } from "@/components/dashboard/MobileBottomNav";
import { Logo } from "@/components/Logo";

const items = [
  { icon: Home, label: "Dashboard", to: "/app", tour: "nav-dashboard" },
  { icon: ArrowLeftRight, label: "Transações", to: "/transacoes", tour: "nav-transacoes" },
  { icon: CreditCard, label: "Cartões", to: "/cartoes", tour: "nav-cartoes" },
  { icon: Repeat, label: "Parcelas & Assinaturas", to: "/recorrentes" },
  { icon: Target, label: "Orçamento", to: "/orcamento" },
  { icon: PiggyBank, label: "Metas", to: "/metas" },
  { icon: TrendingUp, label: "Investimentos", to: "/investimentos" },
  { icon: HeartPulse, label: "Saúde Financeira", to: "/saude-financeira" },
  { icon: Sparkles, label: "Nex.ia", to: "/nex-ia", tour: "nav-nexia" },
];

export const Sidebar = () => {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const initial = profile.nome.charAt(0).toUpperCase() || "U";

  const handleLogout = async () => {
    await signOut();
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
    <>
      {/* Mobile floating menu trigger */}
      <div
        className="md:hidden fixed left-3 z-40"
        style={{ top: "calc(var(--safe-top) + 0.5rem)" }}
      >
        <MobileSidebar />
      </div>

      {/* Mobile bottom navbar */}
      <MobileBottomNav />

      <aside className="hidden md:flex w-60 shrink-0">
        <div className="sticky top-0 h-screen max-h-screen w-60 flex flex-col py-6 px-3 gap-2 glass-sidebar">
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
                <NavLink key={i} to={item.to} end={item.to === "/app"} className={navClass} data-tour={item.tour}>
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1.5 pt-4 border-t border-border/40">
            <NavLink
              to="/perfil"
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-2 h-12 rounded-xl transition-all",
                  isActive ? "bg-surface-elevated/70" : "hover:bg-surface-elevated/50"
                )
              }
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent ring-2 transition-all flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden shrink-0",
                  "ring-border hover:ring-primary/50"
                )}
              >
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
      </aside>
    </>
  );
};
