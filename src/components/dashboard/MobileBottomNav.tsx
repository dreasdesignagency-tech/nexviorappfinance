import { NavLink } from "react-router-dom";
import { Home, ArrowLeftRight, CreditCard, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: Home, label: "Dashboard", to: "/", tour: "nav-dashboard" },
  { icon: ArrowLeftRight, label: "Transações", to: "/transacoes", tour: "nav-transacoes" },
  { icon: CreditCard, label: "Cartões", to: "/cartoes", tour: "nav-cartoes" },
  { icon: Sparkles, label: "nex.ia", to: "/nex-ia", tour: "nav-nexia" },
];

export const MobileBottomNav = () => {
  return (
    <nav
      aria-label="Navegação principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-background/85 backdrop-blur-xl shadow-[0_-8px_30px_hsl(var(--background)/0.6)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex" data-tour={item.tour}>
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex-1 flex flex-col items-center justify-center gap-1 px-2 transition-all duration-200 active:scale-95",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        "flex items-center justify-center h-7 w-10 rounded-full transition-all duration-300",
                        isActive &&
                          "bg-primary/15 shadow-[0_0_18px_hsl(var(--primary)/0.35)]"
                      )}
                    >
                      <Icon
                        className="w-[18px] h-[18px]"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] leading-none font-medium tracking-wide",
                        isActive && "font-semibold"
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
