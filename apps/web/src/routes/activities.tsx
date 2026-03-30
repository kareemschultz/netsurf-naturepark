import { createFileRoute } from "@tanstack/react-router"
import { addOns, buildWhatsAppTextLink, formatGYD } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"

import { AnimatedPageHero } from "../components/AnimatedHeroBg"
import { WhatsAppIcon } from "../components/WhatsAppIcon"

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
                  href={buildWhatsAppTextLink(
                    `Hi! I'd like to book the ${act.name} at Netsurf Nature Park. Can you help?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center gap-2 self-start rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppIcon className="h-[15px] w-[15px]" />
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
              href={buildWhatsAppTextLink(
                "Hi! I'm interested in a Day Pass at Netsurf Nature Park."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              <WhatsAppIcon className="h-[15px] w-[15px]" />
              Book a Day Pass
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
