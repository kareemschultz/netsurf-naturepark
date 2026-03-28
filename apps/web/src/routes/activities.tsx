import { createFileRoute } from "@tanstack/react-router"
import { addOns, contacts, formatGYD } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { AnimatedPageHero } from "../components/AnimatedHeroBg"

export const Route = createFileRoute("/activities")({
  component: ActivitiesPage,
})

const activities = addOns.filter((a) => a.category === "activity")

const iconMap: Record<string, string> = {
  footprints: "🥾",
  waves: "🛶",
}

function ActivitiesPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Experiences"
        title="Activities"
        subtitle="The rainforest is your playground. Here's how to explore it."
      />
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Activities */}
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {activities.map((act) => (
              <div
                key={act.slug}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-7"
              >
                <div className="text-4xl">{iconMap[act.icon] ?? "🌿"}</div>
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h2 className="text-xl font-bold">{act.name}</h2>
                    <Badge
                      className="shrink-0 font-bold"
                      style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                    >
                      {formatGYD(act.priceGYD)}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {act.description}
                  </p>
                </div>
                <a
                  href={`${contacts.whatsappLink}?text=${encodeURIComponent(
                    `Hi! I'd like to book the ${act.name} at Netsurf Nature Park. Can you help?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppSVG />
                  Book Activity
                </a>
              </div>
            ))}
          </div>

          {/* Day pass */}
          <div
            className="rounded-2xl p-7 text-center"
            style={{ backgroundColor: "#2D5016" }}
          >
            <h2 className="mb-2 text-2xl font-black text-white">
              Just here for the day?
            </h2>
            <p className="mx-auto mb-5 max-w-md text-sm text-white/70">
              A Day Pass gives you full access to the park — creek swimming,
              walking trails, and all the wildlife you can find.
              <br />
              <strong className="text-white">GYD $5,000 per person.</strong>
            </p>
            <a
              href={`${contacts.whatsappLink}?text=${encodeURIComponent(
                "Hi! I'm interested in a Day Pass at Netsurf Nature Park."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppSVG />
              Book a Day Pass
            </a>
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
