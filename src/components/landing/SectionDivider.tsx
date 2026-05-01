export const SectionDivider = () => (
  <div className="relative w-full h-16 overflow-hidden pointer-events-none" aria-hidden>
    <svg
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full"
    >
      <path
        d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
        fill="hsl(var(--lp-bg) / 0.6)"
      />
    </svg>
  </div>
);
