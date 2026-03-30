import { Link } from "@tanstack/react-router"
import { contacts, locationDetails } from "@workspace/shared"
import { WhatsAppIcon } from "./WhatsAppIcon"

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: "#1E3A0E" }} className="text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">
              Ready for a quiet weekend by the creek?
            </p>
            <p className="mt-1 text-sm text-white/60">
              Book by WhatsApp and get a personal confirmation from Stephen.
            </p>
          </div>
          <Link
            to="/book"
            search={{ cabin: undefined }}
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#C4941A" }}
          >
            Start a Booking
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="mb-2 text-xl font-black">Netsurf Nature Park</h3>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">
              An eco-retreat on the Soesdyke-Linden Highway, Guyana. Immerse
              yourself in the rainforest, swim in the blackwater creek, and
              unwind in a 100% solar-powered sanctuary.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href={contacts.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <FacebookIcon />
              </a>
              <a
                href={contacts.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <InstagramIcon />
              </a>
              <a
                href={contacts.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-white/50 uppercase">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              {[
                { href: "/cabins", label: "Cabins & Camping" },
                { href: "/activities", label: "Activities" },
                { href: "/dining", label: "Dining" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Getting There" },
                { href: "/policies", label: "Policies" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold tracking-wider text-white/50 uppercase">
              Contact
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <a
                  href={`tel:${contacts.phone1}`}
                  aria-label={`Call primary phone ${contacts.phone1}`}
                  className="transition-colors hover:text-white"
                >
                  {contacts.phone1}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${contacts.phone2}`}
                  aria-label={`Call secondary phone ${contacts.phone2}`}
                  className="transition-colors hover:text-white"
                >
                  {contacts.phone2}
                </a>
              </li>
              <li className="pt-1 leading-relaxed text-white/50">
                {locationDetails.label}
              </li>
              <li>
                <a
                  href={contacts.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-white"
                >
                  View on Google Maps
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row">
          <span>© {year} Netsurf Nature Park. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link
              to="/policies"
              className="transition-colors hover:text-white/70"
            >
              Booking Policies
            </Link>
            <span>·</span>
            <Link
              to="/contact"
              className="transition-colors hover:text-white/70"
            >
              Directions & Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}
