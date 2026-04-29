import { useEffect, useState } from "react";

/**
 * Vídeo de fundo fullscreen fixo. Usa um vídeo público (Pexels) como
 * fallback — pode ser trocado por um arquivo local em /public depois.
 * A opacidade reduz conforme o usuário rola a página.
 */
export const BackgroundVideo = () => {
  const [opacity, setOpacity] = useState(0.55);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = window.innerHeight;
      const next = Math.max(0.08, 0.55 - (y / max) * 0.5);
      setOpacity(next);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
        style={{ opacity }}
      >
        <source
          src="https://cdn.pixabay.com/video/2023/09/23/182559-867429294_large.mp4"
          type="video/mp4"
        />
      </video>
      {/* Overlays para garantir contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
    </div>
  );
};
