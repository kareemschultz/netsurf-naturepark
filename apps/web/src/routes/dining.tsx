import { createFileRoute } from "@tanstack/react-router"
import { addOns, buildWhatsAppTextLink, formatGYD } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"
import { AnimatedPageHero } from "../components/AnimatedHeroBg"

export const Route = createFileRoute("/dining")({
  component: DiningPage,
})

const meals = addOns.filter((a) => a.category === "meal")

const iconMap: Record<string, string> = {
  egg: "🍳",
  utensils: "🍽️",
  flame: "🔥",
}

function DiningPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Food & Drink"
        title="Dining at Netsurf"
        subtitle="DIY-cooking friendly — use our outdoor kitchen, or let us cook for you."
      />
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Meal options */}
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {meals.map((meal) => (
              <article
                key={meal.slug}
                className="flex flex-col rounded-2xl border border-border bg-white p-6"
              >
                <div className="mb-3 text-4xl" aria-hidden="true">
                  {iconMap[meal.icon] ?? "🍴"}
                </div>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-base font-bold">{meal.name}</h2>
                  <Badge
                    className="shrink-0 text-xs font-bold"
                    style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                  >
                    {formatGYD(meal.priceGYD)}
                  </Badge>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
                  {meal.description}
                </p>
                <a
                  href={buildWhatsAppTextLink(
                    `Hi! I'd like to add ${meal.name} to my booking at Netsurf Nature Park.`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Add ${meal.name} to booking on WhatsApp`}
                  className="mt-4 rounded-full px-4 py-2 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  Add to Booking
                </a>
              </article>
            ))}
          </div>

          {/* DIY kitchen note */}
          <div
            className="rounded-2xl border p-7"
            style={{ backgroundColor: "#FAF6F0", borderColor: "#C4941A44" }}
          >
            <div className="mb-3 text-3xl">🛒</div>
            <h2 className="mb-2 text-lg font-bold">
              Bring Your Own Ingredients
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
              Netsurf is a self-catering eco-retreat at heart. Our outdoor
              kitchen is available to all guests — bring your favourite
              ingredients from Georgetown and cook together around the fire.
              It's one of the best parts of the experience.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              There's a small shop on the Soesdyke-Linden Highway nearby for
              basics if you forget anything.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
