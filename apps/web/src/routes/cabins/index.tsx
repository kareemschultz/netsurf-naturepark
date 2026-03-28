import { createFileRoute, Link } from "@tanstack/react-router";
import { cabins, formatGYD, contacts } from "@workspace/shared";
import { Badge } from "@workspace/ui/components/badge";
import { AnimatedPageHero } from "../../components/AnimatedHeroBg";

export const Route = createFileRoute("/cabins/")({
  component: CabinsPage,
});

function CabinsPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Accommodations"
        title="Cabins & Camping"
        subtitle="From open-sky camping to our signature Hansel & Gretel cabin — every option puts you right inside the rainforest."
      />
    <div className="py-12 px-4 min-h-screen">
      <div className="mx-auto max-w-6xl">

        <div className="space-y-8">
          {cabins.map((cabin, i) => (
            <div
              key={cabin.slug}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border flex flex-col md:flex-row"
            >
              {/* Image */}
              <div
                className={`h-56 md:h-auto md:w-80 shrink-0 bg-cover bg-center ${
                  i % 2 === 1 ? "md:order-2" : ""
                }`}
                style={{
                  backgroundImage: `url('${cabin.images[0]}'), linear-gradient(160deg, #2D5016 0%, #3A6B1E 100%)`,
                }}
              />

              {/* Content */}
              <div className="p-7 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex flex-wrap items-start gap-3 mb-3">
                    <h2 className="text-2xl font-black">{cabin.name}</h2>
                    <Badge
                      className="font-bold text-sm"
                      style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                    >
                      {formatGYD(cabin.priceGYD)} / stay
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Up to {cabin.maxGuests} guests
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                    {cabin.description}
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-6">
                    {cabin.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                        <span className="text-[#2D5016] font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/cabins/$slug"
                    params={{ slug: cabin.slug }}
                    className="rounded-full px-6 py-2.5 text-sm font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to="/book"
                    search={{ cabin: cabin.slug }}
                    className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 inline-flex items-center gap-2"
                    style={{ backgroundColor: "#2D5016" }}
                  >
                    Reserve
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Day pass note */}
        <div
          className="mt-10 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between"
          style={{ backgroundColor: "#FAF6F0", border: "1px solid #C4941A33" }}
        >
          <div>
            <h3 className="font-bold text-lg">Just visiting for the day?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Day passes let you explore the park, swim in the creek, and enjoy all the facilities.{" "}
              <strong style={{ color: "#2D5016" }}>GYD $5,000 per person.</strong>
            </p>
          </div>
          <a
            href={`${contacts.whatsappLink}?text=${encodeURIComponent(
              "Hi! I'm interested in a Day Pass at Netsurf Nature Park. Can you help me book?"
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "#2D5016" }}
          >
            Book Day Pass
          </a>
        </div>
      </div>
    </div>
    </>
  );
}

