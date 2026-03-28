import { createFileRoute, Link } from "@tanstack/react-router"
import { motion } from "framer-motion"

import {
  addOns,
  cabins,
  contacts,
  features,
  formatGYD,
  galleryImages,
  testimonials,
} from "@workspace/shared"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import { AnimateIn, StaggerItem, StaggerList } from "../components/AnimateIn"
import { AnimatedHeroBg } from "../components/AnimatedHeroBg"
import {
  NatureArtwork,
  type NatureArtworkVariant,
} from "../components/NatureArtwork"
import { getCabinArtworkVariant } from "../components/natureArtworkData"

export const Route = createFileRoute("/")({
  component: HomePage,
})

const transportAddOn = addOns.find((item) => item.slug === "transport")
const galleryVariants: NatureArtworkVariant[] = [
  "creek",
  "canopy",
  "hideaway",
  "trail",
  "camp",
  "family",
  "fireside",
  "signature",
  "creek",
  "hideaway",
  "trail",
  "camp",
]

function HomePage() {
  return (
    <>
      <HeroSection />
      <BookingCTABar />
      <CabinsSection />
      <FeaturesSection />
      <GallerySection />
      <TestimonialsSection />
      <GetThereSection />
    </>
  )
}

function HeroSection() {
  const quickFacts = [
    "100% solar powered",
    "Blackwater creek access",
    "WhatsApp confirmation in a few hours",
  ]

  return (
    <section
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg, #16330B 0%, #1E3A0E 38%, #31581D 72%, #112508 100%)",
      }}
    >
      <AnimatedHeroBg />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/55" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm"
          >
            <span aria-hidden="true">☀</span>
            <span>Solar-Powered Creekside Stays</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.08,
            }}
            className="text-4xl leading-tight font-black text-balance sm:text-6xl md:text-7xl"
          >
            Guyana's Quiet
            <br />
            Rainforest Escape
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.64,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.2,
            }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/82 sm:text-xl lg:mx-0"
          >
            Sleep beside the blackwater creek, wake to birdsong, and spend the
            day between forest trails, campfires, and slow afternoons under the
            canopy.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.32,
            }}
            className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
          >
            <Link
              to="/book"
              search={{ cabin: undefined }}
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-bold text-white shadow-xl transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: "#C4941A" }}
            >
              Reserve Your Stay
              <ArrowRight />
            </Link>
            <Link
              to="/cabins"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/35 px-7 py-3.5 font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              Explore Cabins
              <ArrowRight />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.58,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.42,
            }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-white/78 lg:justify-start"
          >
            {quickFacts.map((fact) => (
              <span
                key={fact}
                className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5"
              >
                {fact}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1], delay: 0.24 }}
          className="mx-auto w-full max-w-md rounded-[2rem] border border-white/12 bg-white/10 p-4 backdrop-blur-md lg:mx-0"
        >
          <NatureArtwork
            alt="Illustrated view of a cabin, rainforest canopy, and creek at Netsurf Nature Park"
            variant="signature"
            priority
            className="aspect-[5/4] rounded-[1.5rem] border-white/14 bg-white/6"
          />
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-white/72">
            <FactTile
              label="From"
              value={formatGYD(cabins[0]?.priceGYD ?? 8000)}
            />
            <FactTile label="Best For" value="Weekends" />
            <FactTile label="Reply Time" value="A Few Hours" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function FactTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3">
      <p className="text-[10px] tracking-[0.2em] text-white/45 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

function BookingCTABar() {
  return (
    <section className="px-4 py-8" style={{ backgroundColor: "#FAF6F0" }}>
      <div className="mx-auto max-w-5xl">
        <div
          className="rounded-[1.75rem] border border-[#C4941A33] px-6 py-6 shadow-sm"
          style={{ backgroundColor: "#F4EFE4" }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-[#2D5016]/65 uppercase">
                Plan Your Stay
              </p>
              <h2 className="mt-2 text-2xl font-black text-foreground">
                Pick a cabin, choose your dates, and confirm on WhatsApp.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                The booking flow keeps it simple: no surprise payments upfront,
                no endless forms, and a real host confirming the details
                personally.
              </p>
            </div>
            <div className="flex shrink-0 gap-3">
              <Link
                to="/cabins"
                className="rounded-full border border-primary/20 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/6"
              >
                View Cabins
              </Link>
              <Link
                to="/book"
                search={{ cabin: undefined }}
                className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#2D5016" }}
              >
                Start Booking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CabinsSection() {
  return (
    <section className="scroll-mt-28 px-4 py-20" id="cabins">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Where You'll Stay"
          title="Cabins, Camping & Slow Mornings"
          subtitle="Four ways to stay close to the rainforest, from open-sky camping to our signature family cabin."
        />

        <StaggerList className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cabins.map((cabin) => (
            <StaggerItem key={cabin.slug}>
              <motion.article
                className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <NatureArtwork
                  alt={`${cabin.name} illustrated stay experience at Netsurf Nature Park`}
                  variant={getCabinArtworkVariant(cabin)}
                  className="aspect-[5/4] rounded-none border-0 border-b border-border bg-[#17330E]"
                />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base leading-tight font-bold">
                        {cabin.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Up to {cabin.maxGuests} guest
                        {cabin.maxGuests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="shrink-0 text-xs font-semibold"
                      style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                    >
                      {formatGYD(cabin.priceGYD)} / night
                    </Badge>
                  </div>
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {cabin.tagline}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                    {cabin.features.slice(0, 2).map((feature) => (
                      <span
                        key={feature}
                        className="rounded-full bg-secondary px-2.5 py-1"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <Link
                      to="/cabins/$slug"
                      params={{ slug: cabin.slug }}
                      className="flex-1 rounded-xl border border-primary/20 px-3 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/6"
                    >
                      Details
                    </Link>
                    <Link
                      to="/book"
                      search={{ cabin: cabin.slug }}
                      className="flex-1 rounded-xl px-3 py-2 text-center text-xs font-bold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      Book
                    </Link>
                  </div>
                </div>
              </motion.article>
            </StaggerItem>
          ))}
        </StaggerList>

        <AnimateIn delay={0.2} className="mt-10 text-center">
          <Link
            to="/cabins"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#2D5016" }}
          >
            View All Accommodations
            <ArrowRight />
          </Link>
        </AnimateIn>
      </div>
    </section>
  )
}

function FeaturesSection() {
  const iconMap: Record<string, string> = {
    solar: "Solar",
    water: "Creek",
    fire: "Cook",
    tree: "Forest",
    compass: "Guided",
    map: "Close",
  }

  return (
    <section className="px-4 py-20" style={{ backgroundColor: "#2D5016" }}>
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="What Makes Us Different"
          title="Built for Nature Lovers"
          subtitle="We didn't build a resort. We opened a few clearings, kept the creek wild, and let the rainforest stay the main attraction."
          light
        />

        <StaggerList className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.article
                className="h-full rounded-[1.5rem] border border-white/10 bg-white/6 p-6"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="text-xs font-bold tracking-[0.24em] text-white/45 uppercase">
                  {iconMap[feature.icon] ?? "Nature"}
                </p>
                <h3 className="mt-4 text-xl font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {feature.description}
                </p>
              </motion.article>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  )
}

function GallerySection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="A Feel for the Park"
          title="The Experience, Illustrated"
          subtitle="Until the full photography library is ready, these scene studies capture the pace, mood, and landscape of a stay at Netsurf."
        />

        <StaggerList className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {galleryImages.map((image, index) => (
            <StaggerItem
              key={image.alt}
              className={index === 0 ? "col-span-2 row-span-2" : undefined}
            >
              <motion.figure
                className="group overflow-hidden rounded-[1.5rem] border border-border bg-white"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <NatureArtwork
                  alt={image.alt}
                  variant={galleryVariants[index % galleryVariants.length]}
                  className={
                    index === 0
                      ? "aspect-[16/11] rounded-none border-0"
                      : "aspect-[4/3] rounded-none border-0"
                  }
                />
                <figcaption className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  {image.alt}
                </figcaption>
              </motion.figure>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="px-4 py-20" style={{ backgroundColor: "#FAF6F0" }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          label="Stories from the Creek"
          title="Guests Who Found Their Peace"
        />

        <StaggerList className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.id}>
              <motion.blockquote
                className="flex h-full flex-col rounded-[1.75rem] border border-border bg-white p-6 shadow-sm"
                whileHover={{ y: -4 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map(
                    (_, index) => (
                      <StarIcon key={index} />
                    )
                  )}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/80">
                  "{testimonial.text}"
                </p>
                <footer className="mt-5 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      {testimonial.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.location}
                    </p>
                  </div>
                </footer>
              </motion.blockquote>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  )
}

function GetThereSection() {
  return (
    <section className="px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          label="Location"
          title="Easy to Reach, Hard to Forget"
          subtitle="We're just off the Soesdyke-Linden Highway, close enough for a weekend and quiet enough to feel far away."
        />

        <div className="mt-12 grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div className="aspect-video overflow-hidden rounded-[1.75rem] border border-border shadow-sm">
            <iframe
              title="Netsurf Nature Park Location"
              src="https://maps.google.com/maps?q=6.0870307,-58.2677041&z=14&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="space-y-5">
            <InfoCard
              icon="Drive"
              title="By Car"
              description="Head south from Georgetown along the Soesdyke-Linden Highway. The park is easy to find and clearly signposted."
            />
            <InfoCard
              icon="Pickup"
              title="Transport from Georgetown"
              description={
                transportAddOn
                  ? `Need a ride? We can arrange door-to-door transport from Georgetown for ${formatGYD(transportAddOn.priceGYD)} per trip.`
                  : "Need a ride? We can help you arrange transport from Georgetown when you book."
              }
            />
            <InfoCard
              icon="GPS"
              title="GPS Coordinates"
              description="6.0870307, -58.2677041"
              linkLabel="Open in Google Maps"
              linkHref={contacts.mapsLink}
            />
            <InfoCard
              icon="WhatsApp"
              title="Questions? WhatsApp us."
              description="Stephen replies quickly and can help with cabins, day passes, add-ons, and transport."
              linkLabel="Chat Now"
              linkHref={contacts.whatsappLink}
              linkAccent="#25D366"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

function InfoCard({
  icon,
  title,
  description,
  linkHref,
  linkLabel,
  linkAccent = "#2D5016",
}: {
  icon: string
  title: string
  description: string
  linkHref?: string
  linkLabel?: string
  linkAccent?: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[11px] font-bold tracking-[0.18em] uppercase"
          style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
          {linkHref && linkLabel && (
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: linkAccent }}
            >
              {linkLabel}
              <ArrowRight />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({
  label,
  title,
  subtitle,
  light = false,
}: {
  label?: string
  title: string
  subtitle?: string
  light?: boolean
}) {
  return (
    <AnimateIn className="mx-auto max-w-2xl text-center">
      {label && (
        <span
          className={`text-xs font-bold tracking-[0.26em] uppercase ${
            light ? "text-white/50" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      )}
      <h2
        className={`mt-2 text-3xl leading-tight font-black text-balance sm:text-4xl ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm leading-relaxed text-pretty ${
            light ? "text-white/65" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      )}
    </AnimateIn>
  )
}

function ArrowRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="#C4941A"
      stroke="none"
      aria-hidden="true"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
