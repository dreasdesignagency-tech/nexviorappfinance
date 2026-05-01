import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CHECKOUT_MENSAL } from "@/config/checkout";
import { cn } from "@/lib/utils";

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#nex-ia", label: "nex.ia" },
  { href: "#planos", label: "Planos" },
];

export const LandingNav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-colors",
        "backdrop-blur-2xl border-b",
        scrolled
          ? "bg-[hsl(var(--lp-bg)/0.7)] border-[hsl(var(--lp-border))]"
          : "bg-[hsl(var(--lp-bg)/0.3)] border-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 shrink-0">
          <Logo variant="white" className="h-7 w-auto" />
          <span className="text-white font-semibold tracking-tight text-lg">Nexvior</span>
        </a>

        <ul className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:flex">
          <a
            href={CHECKOUT_MENSAL}
            className="lp-btn-primary px-5 py-2.5 text-sm rounded-full"
          >
            Começar agora
          </a>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-[hsl(var(--lp-border))] bg-[hsl(var(--lp-bg)/0.95)] backdrop-blur-2xl">
          <div className="px-4 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-white/80 py-2"
              >
                {l.label}
              </a>
            ))}
            <a
              href={CHECKOUT_MENSAL}
              className="lp-btn-primary px-5 py-3 rounded-full text-center"
            >
              Começar agora
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
