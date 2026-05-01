import { useEffect, useRef, useState } from "react";
import heroVideo from "@/assets/landing-hero.mp4";

export const HeroVideo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = true;
      const tryPlay = () => v.play().catch((err) => console.warn("video autoplay bloqueado:", err));
      tryPlay();
      // tenta de novo se houver gesto do usuário
      const onInteract = () => tryPlay();
      window.addEventListener("click", onInteract, { once: true });
      window.addEventListener("touchstart", onInteract, { once: true });
      return () => {
        window.removeEventListener("click", onInteract);
        window.removeEventListener("touchstart", onInteract);
      };
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
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
        disablePictureInPicture
        controls={false}
        onError={(e) => console.error("Video playback error:", e)}
        onLoadedData={() => console.log("[HeroVideo] loaded")}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ mixBlendMode: "screen" }}
      />
      {/* vinheta para integrar o vídeo ao fundo preto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, hsl(0 0% 0% / 0.55) 80%, hsl(0 0% 0%) 100%)",
        }}
      />
    </div>
  );
};
