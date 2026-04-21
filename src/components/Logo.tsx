import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import logoBlue from "@/assets/logo-n.png";

interface LogoProps {
  className?: string;
  /** Force a variant. If omitted, adapts to current theme (dark → white, light → blue). */
  variant?: "auto" | "white" | "blue";
  alt?: string;
}

/**
 * Brand logo that adapts to the active theme.
 * - Dark backgrounds → white logo (achieved via CSS filter)
 * - Light backgrounds → original blue logo
 */
export const Logo = ({ className, variant = "auto", alt = "Nexvior" }: LogoProps) => {
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : true
  );

  useEffect(() => {
    if (variant !== "auto") return;
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, [variant]);

  const showWhite = variant === "white" || (variant === "auto" && isDark);

  return (
    <img
      src={logoBlue}
      alt={alt}
      draggable={false}
      className={cn(
        "object-contain select-none pointer-events-none transition-[filter] duration-300",
        showWhite && "[filter:brightness(0)_invert(1)]",
        className
      )}
    />
  );
};
