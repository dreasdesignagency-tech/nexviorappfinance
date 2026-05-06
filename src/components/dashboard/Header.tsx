import { Plus, Sun, Moon } from "lucide-react";
import { useTheme } from "@/store/theme";
import { NavLink } from "react-router-dom";
import { useProfile } from "@/store/profile";
import { useAuth } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";

interface HeaderProps {
  userName?: string;
  onNewTransaction?: () => void;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const getFirstName = (name?: string) => {
  if (!name) return "";
  return name.trim().split(/\s+/)[0];
};

export const Header = ({ userName, onNewTransaction }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const { user } = useAuth();

  const resolvedName = userName ?? profile.nome ?? "";
  const fallbackFromEmail = user?.email?.split("@")[0] ?? "";
  const displayName = resolvedName || fallbackFromEmail || "Usuário";
  const firstName = getFirstName(displayName) || "Usuário";
  const initial = firstName.charAt(0).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between mb-4 md:mb-6 gap-2 md:gap-4 flex-nowrap px-0 pl-11 md:pl-0 md:px-0 min-w-0">
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] xs:text-base sm:text-xl md:text-3xl font-bold tracking-tight text-foreground truncate leading-tight">
          {getGreeting()},{" "}
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="hidden md:block text-sm text-muted-foreground/80 mt-1 truncate">Clareza total sobre seu dinheiro</p>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3 shrink-0 self-center">
        <NotificationsBell />

        {/* Avatar visível apenas no mobile, ao lado do sino */}
        <NavLink
          to="/perfil"
          aria-label="Perfil"
          className="md:hidden w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent ring-2 ring-border hover:ring-primary/50 transition-all flex items-center justify-center text-xs font-bold text-primary-foreground overflow-hidden shrink-0"
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt={firstName} className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </NavLink>

        <button
          onClick={onNewTransaction}
          data-tour="new-transaction-desktop"
          className="hidden md:flex h-10 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-sm font-semibold items-center gap-2 glow-primary hover:opacity-95 transition px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Transação</span>
        </button>

        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          aria-label="Alternar tema"
          className="w-9 h-9 md:w-10 md:h-10 rounded-full glass-inner flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
