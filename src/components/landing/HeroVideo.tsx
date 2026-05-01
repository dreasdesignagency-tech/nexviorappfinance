import { useEffect, useRef, useState } from "react";
import heroVideo from "@/assets/landing-hero.mp4";

export const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      // fade out gradualmente até 600px de scroll
      const next = Math.max(0, 1 - y / 600);
      setOpacity(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-[5] pointer-events-none overflow-hidden"
      style={{ opacity }}
      aria-hidden
    >
      <video
        ref={videoRef}
        src={heroVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ mixBlendMode: "hard-light" }}
      />
      {/* vinheta para integrar o vídeo ao fundo preto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, hsl(0 0% 0% / 0.6) 75%, hsl(0 0% 0%) 100%)",
        }}
      />
    </div>
  );
};
