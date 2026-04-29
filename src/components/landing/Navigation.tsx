import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { APP_URL } from "@/config/checkout";

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#nexia", label: "nex.ia" },
  { href: "#beneficios", label: "Benefícios" },
];

export const Navigation = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all ${
        scrolled ? "glass-nav" : "bg-transparent"
      }`}
      style={{ paddingTop: "var(--safe-top)" }}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center font-black text-white shadow-[0_0_24px_hsl(var(--primary)/0.6)]">
            N
          </div>
          <span className="font-semibold tracking-tight text-white">Nexvior</span>
        </Link>

        <ul className="hidden md:flex items-center gap-10 text-sm text-white/70">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="hover:text-white transition-colors">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden md:block">
          <Link
            to={APP_URL}
            className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
          >
            Acessar app
          </Link>
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="md:hidden text-white p-2"
          aria-label="Abrir menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden glass-nav border-t border-white/10">
          <div className="px-5 py-4 flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <Link
              to={APP_URL}
              className="mt-2 px-5 py-2.5 rounded-full bg-white text-black text-sm font-medium text-center"
            >
              Acessar app
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
