import { useState } from "react"

import { createFileRoute, Link } from "@tanstack/react-router"

import {
  buildWhatsAppTextLink,
  cabins,
  dayPassPriceGYD,
  formatGYD,
} from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"

import { AnimatedPageHero } from "../../components/AnimatedHeroBg"
import { BlurFade } from "../../components/BlurFade"
import { NatureArtwork } from "../../components/NatureArtwork"
import { getCabinArtworkVariant } from "../../components/natureArtworkData"
import { getCabinPrimaryPhoto } from "../../components/cabinPhotos"

export const Route = createFileRoute("/cabins/")({
  component: CabinsPage,
})

function CabinsPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Accommodations"
        title="Cabins & Camping"
        subtitle="From open-sky camping to our signature family cabin, every stay keeps the rainforest front and center."
      />

      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-8">
            {cabins.map((cabin, index) => (
              <BlurFade key={cabin.slug} delay={index * 0.1} inView>
              <article
                className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm"
              >
                <div className="grid md:grid-cols-[minmax(0,22rem)_1fr]">
                  <CabinCardPhoto
                    cabin={cabin}
                    flip={index % 2 === 1}
                  />

                  <div className="flex flex-col justify-between p-7">
                    <div>
                      <div className="mb-4 flex flex-wrap items-start gap-3">
                        <div>
                          <h2 className="text-2xl font-black">{cabin.name}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {cabin.tagline}
                          </p>
                        </div>
                        <Badge
                          className="text-sm font-bold"
                          style={{
                            backgroundColor: "#FAF6F0",
                            color: "#2D5016",
                          }}
                        >
                          {formatGYD(cabin.priceGYD)} / night
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Up to {cabin.maxGuests} guest
                          {cabin.maxGuests !== 1 ? "s" : ""}
                        </Badge>
                      </div>

                      <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                        {cabin.description}
                      </p>

                      <ul className="grid grid-cols-1 gap-2 text-sm text-foreground/80 sm:grid-cols-2">
                        {cabin.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <span className="font-bold text-[#2D5016]">+</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        to="/cabins/$slug"
                        params={{ slug: cabin.slug }}
                        className="rounded-full border-2 border-primary/20 px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/6"
                      >
                        View Details
                      </Link>
                      <Link
                        to="/book"
                        search={{ cabin: cabin.slug }}
                        className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#2D5016" }}
                      >
                        Reserve
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
              </BlurFade>
            ))}
          </div>

          <BlurFade delay={0.2} inView>
          <div
            className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] border p-6 sm:flex-row sm:items-center"
            style={{ backgroundColor: "#FAF6F0", borderColor: "#C4941A33" }}
          >
            <div>
              <h3 className="text-lg font-bold">Just visiting for the day?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Day passes include access to the creek, trails, and the rest of
                the park.{" "}
                <strong style={{ color: "#2D5016" }}>
                  {formatGYD(dayPassPriceGYD)} per person.
                </strong>
              </p>
            </div>
            <a
              href={buildWhatsAppTextLink(
                "Hi! I'm interested in a Day Pass at Netsurf Nature Park. Can you help me book?"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-full px-6 py-2.5 text-sm font-bold text-white"
              style={{ backgroundColor: "#2D5016" }}
            >
              Book Day Pass
            </a>
          </div>
          </BlurFade>
        </div>
      </div>
    </>
  )
}

function CabinCardPhoto({
  cabin,
  flip,
}: {
  cabin: Parameters<typeof getCabinArtworkVariant>[0]
  flip: boolean
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const photo = getCabinPrimaryPhoto(cabin.slug)
  const className = `aspect-[5/4] rounded-none border-0 md:aspect-auto w-full h-full object-cover${flip ? " md:order-2" : ""}`

  if (photo && !imgFailed) {
    return (
      <img
        src={photo}
        alt={`${cabin.name} at Netsurf Nature Park`}
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
        className={className}
      />
    )
  }

  return (
    <NatureArtwork
      alt={`${cabin.name} at Netsurf Nature Park`}
      variant={getCabinArtworkVariant(cabin)}
      className={`aspect-[5/4] rounded-none border-0 md:aspect-auto${flip ? " md:order-2" : ""}`}
    />
  )
}
