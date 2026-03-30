import { createFileRoute } from "@tanstack/react-router"
import {
  addOns,
  buildWhatsAppTextLink,
  contacts,
  formatGYD,
} from "@workspace/shared"

import { AnimatedPageHero } from "../components/AnimatedHeroBg"
import { WhatsAppIcon } from "../components/WhatsAppIcon"

export const Route = createFileRoute("/contact")({
  component: ContactPage,
})

const transport = addOns.find((a) => a.slug === "transport")

function ContactPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Find Us"
        title="Contact & Directions"
        subtitle="On the Soesdyke-Linden Highway — always a WhatsApp message away."
      />
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left: contact info */}
            <div className="space-y-6">
              {/* Phone */}
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Call or WhatsApp</h2>
                <div className="space-y-3">
                  <a
                    href={`tel:${contacts.phone1}`}
                    className="group flex items-center gap-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm text-white"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      📞
                    </div>
                    <div>
                      <p className="font-semibold group-hover:underline">
                        {contacts.phone1}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Primary contact
                      </p>
                    </div>
                  </a>
                  <a
                    href={`tel:${contacts.phone2}`}
                    className="group flex items-center gap-3"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm text-white"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      📞
                    </div>
                    <div>
                      <p className="font-semibold group-hover:underline">
                        {contacts.phone2}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Secondary contact
                      </p>
                    </div>
                  </a>
                </div>
                <a
                  href={contacts.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppIcon className="h-[15px] w-[15px]" />
                  Message on WhatsApp
                </a>
              </div>

              {/* Location */}
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Location</h2>
                <p className="mb-1 text-sm leading-relaxed text-muted-foreground">
                  Soesdyke-Linden Highway, Guyana
                </p>
                <p className="mb-4 font-mono text-xs text-muted-foreground">
                  GPS: 6.0870307, -58.2677041
                </p>
                <a
                  href={contacts.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-2"
                  style={{ color: "#2D5016" }}
                >
                  Open in Google Maps →
                </a>
              </div>

              {/* Transport */}
              {transport && (
                <div
                  className="rounded-2xl border p-6"
                  style={{
                    backgroundColor: "#FAF6F0",
                    borderColor: "#C4941A44",
                  }}
                >
                  <h2 className="mb-2 text-lg font-bold">Need a Ride?</h2>
                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    We offer door-to-door transport from Georgetown.{" "}
                    <strong style={{ color: "#2D5016" }}>
                      {formatGYD(transport.priceGYD)} per trip.
                    </strong>{" "}
                    Just mention it when you book.
                  </p>
                  <a
                    href={buildWhatsAppTextLink(
                      "Hi! I'd like to arrange transport from Georgetown to Netsurf Nature Park."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <WhatsAppIcon className="h-[15px] w-[15px]" />
                    Arrange Transport
                  </a>
                </div>
              )}

              {/* Social */}
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Follow Us</h2>
                <div className="flex flex-wrap gap-3">
                  <a
                    href={contacts.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: "#1877F2" }}
                  >
                    Facebook
                  </a>
                  <a
                    href={contacts.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)",
                    }}
                  >
                    Instagram
                  </a>
                </div>
              </div>
            </div>

            {/* Right: map */}
            <div
              className="min-h-[360px] overflow-hidden rounded-2xl border border-border shadow-sm md:min-h-[480px]"
            >
              <iframe
                title="Netsurf Nature Park on Google Maps"
                src="https://maps.google.com/maps?q=6.0870307,-58.2677041&z=14&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
