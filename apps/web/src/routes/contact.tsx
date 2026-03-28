import { createFileRoute } from "@tanstack/react-router"
import { addOns, contacts, formatGYD } from "@workspace/shared"
import { AnimatedPageHero } from "../components/AnimatedHeroBg"

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
                  <WhatsAppSVG />
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
                    href={`${contacts.whatsappLink}?text=${encodeURIComponent(
                      "Hi! I'd like to arrange transport from Georgetown to Netsurf Nature Park."
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#25D366" }}
                  >
                    <WhatsAppSVG />
                    Arrange Transport
                  </a>
                </div>
              )}

              {/* Social */}
              <div className="rounded-2xl border border-border bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Follow Us</h2>
                <div className="flex gap-3">
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
              className="overflow-hidden rounded-2xl border border-border shadow-sm"
              style={{ minHeight: 480 }}
            >
              <iframe
                title="Netsurf Nature Park on Google Maps"
                src="https://maps.google.com/maps?q=6.0870307,-58.2677041&z=14&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: 480 }}
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

function WhatsAppSVG() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.532 5.864L0 24l6.29-1.51A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.733.897.939-3.63-.234-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  )
}
