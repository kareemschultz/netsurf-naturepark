import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet";
import { contacts } from "@workspace/shared";


const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cabins", label: "Cabins" },
  { href: "/activities", label: "Activities" },
  { href: "/dining", label: "Dining" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      {/* Top bar */}
      <div style={{ backgroundColor: "#1E3A0E" }} className="hidden md:block border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-between text-xs text-white/70">
          <span>Soesdyke-Linden Highway, Guyana</span>
          <div className="flex items-center gap-4">
            <a href={`tel:${contacts.phone1}`} className="hover:text-white transition-colors">
              {contacts.phone1}
            </a>
            <span>·</span>
            <a href={`tel:${contacts.phone2}`} className="hover:text-white transition-colors">
              {contacts.phone2}
            </a>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <header
        style={{ backgroundColor: "#1E3A0E" }}
        className={`sticky top-0 z-50 transition-shadow duration-200 ${
          scrolled ? "shadow-lg shadow-black/20" : ""
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="flex flex-col leading-none">
              <span className="font-black text-white text-lg tracking-tight">
                Netsurf Nature Park
              </span>
              <span className="text-white/50 text-[10px] uppercase tracking-widest">
                Eco-Retreat · Guyana
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="px-3 py-1.5 text-sm text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors [&.active]:text-white [&.active]:font-semibold"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <Link
            to="/book"
            search={{ cabin: undefined }}
            className="hidden md:flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4941A" }}
          >
            Book Now
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label="Open menu"
            >
              <HamburgerIcon />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-l-0 p-0"
              style={{ backgroundColor: "#1E3A0E" }}
            >
              <div className="flex flex-col h-full p-6">
                <div className="mb-8">
                  <span className="font-black text-white text-lg">
                    Netsurf Nature Park
                  </span>
                  <p className="text-white/50 text-xs mt-0.5 uppercase tracking-widest">
                    Eco-Retreat · Guyana
                  </p>
                </div>
                <nav className="flex flex-col gap-1 flex-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="px-3 py-2.5 text-white/80 hover:text-white rounded-md hover:bg-white/10 transition-colors font-medium [&.active]:text-white [&.active]:bg-white/10"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-8 space-y-3 text-sm text-white/50">
                  <a href={`tel:${contacts.phone1}`} className="block hover:text-white/80">
                    {contacts.phone1}
                  </a>
                  <a href={`tel:${contacts.phone2}`} className="block hover:text-white/80">
                    {contacts.phone2}
                  </a>
                </div>
                <Link
                  to="/book"
                  search={{ cabin: undefined }}
                  onClick={() => setOpen(false)}
                  className="mt-4 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#C4941A" }}
                >
                  Reserve Your Stay
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

