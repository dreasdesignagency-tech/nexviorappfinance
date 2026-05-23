import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FounderBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export const FounderBadge = ({ className, size = "sm" }: FounderBadgeProps) => {
  const isSm = size === "sm";
  return (
    <span
      title="Founder — Acesso Antecipado"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold border",
        "bg-gradient-to-r from-amber-300/15 via-yellow-300/10 to-amber-300/15",
        "border-amber-300/40 text-amber-200",
        "shadow-[0_0_20px_-6px_rgba(251,191,36,0.55)]",
        isSm ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        className,
      )}
    >
      <Crown className={isSm ? "w-3 h-3" : "w-3.5 h-3.5"} />
      Founder
    </span>
  );
};

export default FounderBadge;
