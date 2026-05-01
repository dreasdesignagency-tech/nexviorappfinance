import { ChevronDown } from "lucide-react";

interface SectionDividerProps {
  flip?: boolean;
  className?: string;
}

export const SectionDivider = ({ flip = false, className = "" }: SectionDividerProps) => {
  return (
    <div
      className={`relative w-full overflow-visible leading-[0] ${className}`}
      style={{ zIndex: 10 }}
      aria-hidden="true"
    >
      <svg
        className={`relative block w-full h-[70px] md:h-[110px] ${flip ? "rotate-180" : ""}`}
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sd-line" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--lp-neon))" stopOpacity="0.75" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="sd-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--lp-neon))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--lp-neon))" stopOpacity="0" />
          </radialGradient>
        </defs>

        <path
          d="M0,55 C240,110 480,10 660,50 C685,58 695,62 700,62 C700,80 740,80 740,62 C745,62 755,58 780,50 C960,10 1200,90 1440,55 L1440,110 L0,110 Z"
          fill="hsl(var(--background))"
        />

        <path
          d="M0,55 C240,110 480,10 660,50 C685,58 695,62 700,62 M740,62 C745,62 755,58 780,50 C960,10 1200,90 1440,55"
          fill="none"
          stroke="url(#sd-line)"
          strokeWidth="1.5"
        />

        <ellipse cx="720" cy="70" rx="60" ry="20" fill="url(#sd-glow)" />
      </svg>

      <div className={`absolute left-1/2 -translate-x-1/2 ${flip ? "bottom-[35%] md:bottom-[40%]" : "top-[35%] md:top-[40%]"}`}>
        <div className={`flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full border border-neon/40 bg-background shadow-[0_0_20px_hsl(var(--lp-neon)/0.35)] animate-bounce-slow ${flip ? "rotate-180" : ""}`}>
          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-neon" strokeWidth={2.25} />
        </div>
      </div>
    </div>
  );
};

export default SectionDivider;
