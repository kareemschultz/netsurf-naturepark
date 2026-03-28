import { createFileRoute } from "@tanstack/react-router";
import { addOns, contacts } from "@workspace/shared";
import { Badge } from "@workspace/ui/components/badge";
import { AnimatedPageHero } from "../components/AnimatedHeroBg";

export const Route = createFileRoute("/dining")({
  component: DiningPage,
});

const meals = addOns.filter((a) => a.category === "meal");

const iconMap: Record<string, string> = {
  egg: "🍳",
  utensils: "🍽️",
  flame: "🔥",
};

function DiningPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Food & Drink"
        title="Dining at Netsurf"
        subtitle="DIY-cooking friendly — use our outdoor kitchen, or let us cook for you."
      />
    <div className="py-12 px-4 min-h-screen">
      <div className="mx-auto max-w-4xl">

        {/* Meal options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {meals.map((meal) => (
            <div
              key={meal.slug}
              className="bg-white rounded-2xl border border-border p-6 flex flex-col"
            >
              <div className="text-4xl mb-3">{iconMap[meal.icon] ?? "🍴"}</div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-bold text-base">{meal.name}</h2>
                <Badge
                  className="font-bold text-xs shrink-0"
                  style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                >
                  GYD ${meal.priceGYD.toLocaleString()}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                {meal.description}
              </p>
              <a
                href={`${contacts.whatsappLink}?text=${encodeURIComponent(
                  `Hi! I'd like to add ${meal.name} to my booking at Netsurf Nature Park.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 text-center rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#25D366" }}
              >
                Add to Booking
              </a>
            </div>
          ))}
        </div>

        {/* DIY kitchen note */}
        <div
          className="rounded-2xl p-7 border"
          style={{ backgroundColor: "#FAF6F0", borderColor: "#C4941A44" }}
        >
          <div className="text-3xl mb-3">🛒</div>
          <h2 className="font-bold text-lg mb-2">Bring Your Own Ingredients</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Netsurf is a self-catering eco-retreat at heart. Our outdoor kitchen
            is available to all guests — bring your favourite ingredients from
            Georgetown and cook together around the fire. It's one of the best
            parts of the experience.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            There's a small shop on the Soesdyke-Linden Highway nearby for
            basics if you forget anything.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
