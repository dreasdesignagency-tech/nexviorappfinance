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
        "inline-flex items-center gap-1 rounded-full font-semibold border backdrop-blur-md",
        "bg-[linear-gradient(135deg,hsl(var(--primary)/0.18),hsl(var(--primary-glow)/0.12))]",
        "border-primary/40 text-primary",
        "shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7),inset_0_1px_0_hsl(var(--foreground)/0.08)]",
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
