import { ChevronDown } from "lucide-react";

export const SectionDivider = () => {
  return (
    <div className="relative w-full h-32 flex items-center justify-center" aria-hidden="true">
      <svg
        className="absolute inset-x-0 w-full h-full"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="divider-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,60 C300,90 900,30 1200,60"
          fill="none"
          stroke="url(#divider-grad)"
          strokeWidth="1.5"
        />
      </svg>
      <div className="relative w-12 h-12 rounded-full bg-black border border-primary/40 flex items-center justify-center neon-glow">
        <ChevronDown className="w-5 h-5 text-neon animate-bounce-slow" />
      </div>
    </div>
  );
};
