import { useState, useEffect } from "react"
import type { ComponentPropsWithoutRef } from "react"
import { Link } from "@tanstack/react-router"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { contacts } from "@workspace/shared"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/cabins", label: "Cabins" },
  { href: "/activities", label: "Activities" },
  { href: "/gallery", label: "Gallery" },
  { href: "/dining", label: "Dining" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/policies", label: "Policies" },
  { href: "/faq", label: "FAQ" },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let rafId = 0
    const handler = () => {
      if (rafId !== 0) {
        return
      }

      rafId = window.requestAnimationFrame(() => {
        const next = window.scrollY > 20
        setScrolled((current) => (current === next ? current : next))
        rafId = 0
      })
    }

    window.addEventListener("scroll", handler, { passive: true })
    return () => {
      window.removeEventListener("scroll", handler)
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return (
    <>
      <div
        style={{ backgroundColor: "#17310C" }}
        className="hidden border-b border-white/10 md:block"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs text-white/75">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-white/80">
              <span aria-hidden="true">☀</span>
              Solar-Powered Stays
            </span>
            <span>{contacts.locationName}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`tel:${contacts.phone1}`}
              aria-label={`Call primary phone ${contacts.phone1}`}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {contacts.phone1}
            </a>
            <span>·</span>
            <a
              href={`tel:${contacts.phone2}`}
              aria-label={`Call secondary phone ${contacts.phone2}`}
              className="rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {contacts.phone2}
            </a>
          </div>
        </div>
      </div>

      <header
        style={{ backgroundColor: "rgba(30, 58, 14, 0.94)" }}
        className={`sticky top-0 z-50 border-b border-white/10 backdrop-blur-md transition-shadow duration-200 ${
          scrolled ? "shadow-lg shadow-black/20" : "shadow-none"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            aria-label="Netsurf Nature Park home"
            className="group flex items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E3A0E]"
          >
            <div
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-[11px] font-black tracking-[0.24em] text-white/90 sm:flex"
              aria-hidden="true"
            >
              NNP
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-white sm:text-xl">
                Netsurf Nature Park
              </span>
              <span className="text-[10px] tracking-[0.24em] text-white/55 uppercase transition-colors group-hover:text-white/70">
                Creekside Cabins · Guyana
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 md:flex"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-full px-3.5 py-2 text-sm text-white/78 transition-colors hover:bg-white/8 hover:text-white [&.active]:bg-white/10 [&.active]:font-semibold [&.active]:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/book"
            search={{ cabin: undefined }}
            className="hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 md:flex"
            style={{ backgroundColor: "#C4941A" }}
          >
            Reserve Your Stay
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className="rounded-md p-2 text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80 md:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              <HamburgerIcon aria-hidden="true" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-l-0 p-0"
              style={{ backgroundColor: "#1E3A0E" }}
            >
              <div className="flex h-full flex-col p-6">
                <div className="mb-8">
                  <span className="text-lg font-black text-white">
                    Netsurf Nature Park
                  </span>
                  <p className="mt-0.5 text-xs tracking-[0.24em] text-white/50 uppercase">
                    Creekside Cabins · Guyana
                  </p>
                </div>
                <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-2.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80 [&.active]:bg-white/10 [&.active]:text-white"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-8 space-y-3 text-sm text-white/50">
                  <p className="text-xs tracking-[0.24em] text-white/35 uppercase">
                    Call or WhatsApp
                  </p>
                  <a
                    href={`tel:${contacts.phone1}`}
                    className="block rounded-sm hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    {contacts.phone1}
                  </a>
                  <a
                    href={`tel:${contacts.phone2}`}
                    className="block rounded-sm hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
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
  )
}

function HamburgerIcon(props: ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      {...props}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
