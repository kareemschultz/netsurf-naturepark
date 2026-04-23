import { useState } from "react"

import { createFileRoute, Link, notFound } from "@tanstack/react-router"

import { cabins, formatGYD, whatsappBookingLink } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"

import { BlurFade } from "../../components/BlurFade"
import {
  NatureArtwork,
  type NatureArtworkVariant,
} from "../../components/NatureArtwork"
import { getCabinArtworkVariant } from "../../components/natureArtworkData"
import { getCabinGalleryPhotos, getCabinPrimaryPhoto } from "../../components/cabinPhotos"
import { WhatsAppIcon } from "../../components/WhatsAppIcon"
import { fetchManagedPhotos, toUploadUrl } from "../../lib/content"

export const Route = createFileRoute("/cabins/$slug")({
  component: CabinDetailPage,
  loader: async ({ params }) => {
    const cabin = cabins.find((item) => item.slug === params.slug)
    if (!cabin) {
      throw notFound()
    }

    let managedPhotos: string[] = []
    try {
      const photos = await fetchManagedPhotos(`cabin:${cabin.slug}`)
      managedPhotos = photos.map((photo) => toUploadUrl(photo.filename))
    } catch {}

    return { cabin, managedPhotos }
  },
})

function CabinDetailPage() {
  const { cabin, managedPhotos } = Route.useLoaderData()
  const baseVariant = getCabinArtworkVariant(cabin)
  const supportingVariants = buildSupportingVariants(baseVariant)
  const fallbackPrimaryPhoto = getCabinPrimaryPhoto(cabin.slug)
  const fallbackGalleryPhotos = getCabinGalleryPhotos(cabin.slug)
  const primaryPhoto = managedPhotos[0] ?? fallbackPrimaryPhoto
  const galleryPhotos = managedPhotos.length > 0 ? managedPhotos : fallbackGalleryPhotos

  return (
    <div className="min-h-screen px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <nav
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link to="/" className="transition-colors hover:text-foreground">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to="/cabins"
            className="transition-colors hover:text-foreground"
          >
            Cabins
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-foreground">{cabin.name}</span>
        </nav>

        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={`${cabin.name} at Netsurf Nature Park`}
            loading="eager"
            decoding="async"
            className="aspect-[16/9] w-full rounded-[2rem] object-cover"
          />
        ) : (
          <NatureArtwork
            alt={`${cabin.name} at Netsurf Nature Park`}
            variant={baseVariant}
            priority
            className="aspect-[16/9] rounded-[2rem] border-[#C4941A22] bg-[#17330E]"
          />
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-4 flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-black">{cabin.name}</h1>
              <Badge
                className="font-bold"
                style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
              >
                Up to {cabin.maxGuests} guest{cabin.maxGuests !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {cabin.category === "camping" ? "Camping" : "Cabin Stay"}
              </Badge>
            </div>

            <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
              {cabin.description}
            </p>

            <div
              className="mt-8 rounded-[1.75rem] border p-5"
              style={{ backgroundColor: "#FAF6F0", borderColor: "#C4941A33" }}
            >
              <p className="text-xs font-bold tracking-[0.22em] text-[#2D5016]/65 uppercase">
                Good to Know
              </p>
              <div className="mt-3 grid gap-3 text-sm text-foreground/80 sm:grid-cols-3">
                <div>
                  <p className="font-semibold">Reply Time</p>
                  <p className="mt-1 text-muted-foreground">
                    Usually within a few hours
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Payment</p>
                  <p className="mt-1 text-muted-foreground">
                    Bank transfer after confirmation
                  </p>
                </div>
                <div>
                  <p className="font-semibold">Atmosphere</p>
                  <p className="mt-1 text-muted-foreground">
                    Quiet, solar-powered, creekside
                  </p>
                </div>
              </div>
            </div>

            <h2 className="mt-10 text-lg font-bold">What's Included</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cabin.features.map((feature, i) => (
                <BlurFade key={feature} delay={i * 0.07} inView>
                <li
                  className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs text-white"
                    style={{ backgroundColor: "#2D5016" }}
                  >
                    +
                  </span>
                  {feature}
                </li>
                </BlurFade>
              ))}
            </ul>

            <h2 className="mt-10 text-lg font-bold">A Feel for This Stay</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {galleryPhotos.length > 0
                ? galleryPhotos.map((src, index) => (
                    <BlurFade key={src} delay={index * 0.1} inView>
                    <CabinGalleryPhoto
                      src={src}
                      alt={`${cabin.name} photo ${index + 1}`}
                      fallbackVariant={supportingVariants[index] ?? baseVariant}
                    />
                    </BlurFade>
                  ))
                : supportingVariants.map((variant, index) => (
                    <BlurFade key={`${variant}-${index}`} delay={index * 0.1} inView>
                    <NatureArtwork
                      alt={`${cabin.name} atmosphere scene ${index + 1}`}
                      variant={variant}
                      className="aspect-[4/3] rounded-[1.25rem] border-[#C4941A18]"
                    />
                    </BlurFade>
                  ))}
            </div>
          </div>

          <BlurFade delay={0.2} inView className="lg:col-span-1">
          <aside>
            <div className="sticky top-24 rounded-[1.75rem] border border-border bg-white p-6 shadow-sm">
              <div className="mb-5 text-center">
                <div
                  className="text-3xl font-black"
                  style={{ color: "#2D5016" }}
                >
                  {formatGYD(cabin.priceGYD)}
                </div>
                <div className="text-sm text-muted-foreground">per night</div>
              </div>

              <Link
                to="/book"
                search={{ cabin: cabin.slug }}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#2D5016" }}
              >
                Reserve This Stay
              </Link>

              <a
                href={whatsappBookingLink(cabin)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ borderColor: "#25D366", color: "#25D366" }}
              >
                <WhatsAppIcon className="h-4 w-4" />
                Ask on WhatsApp
              </a>

              <p className="mb-5 text-center text-xs leading-relaxed text-muted-foreground">
                No payment is taken before Stephen confirms availability and
                sends the final details.
              </p>

              <div className="space-y-3 border-t border-border pt-5 text-sm">
                <SidebarRow label="Max guests" value={`${cabin.maxGuests}`} />
                <SidebarRow
                  label="Category"
                  value={
                    cabin.category === "camping" ? "Camping" : "Private cabin"
                  }
                />
                <SidebarRow label="Power" value="100% solar" />
                <SidebarRow label="Confirmation" value="Within a few hours" />
              </div>
            </div>
          </aside>
          </BlurFade>
        </div>

        <div className="mt-12">
          <Link
            to="/cabins"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "#2D5016" }}
          >
            <ArrowLeft />
            Back to all cabins
          </Link>
        </div>
      </div>
    </div>
  )
}

function CabinGalleryPhoto({
  src,
  alt,
  fallbackVariant,
}: {
  src: string
  alt: string
  fallbackVariant: NatureArtworkVariant
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <NatureArtwork
        alt={alt}
        variant={fallbackVariant}
        className="aspect-[4/3] rounded-[1.25rem] border-[#C4941A18]"
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="aspect-[4/3] w-full rounded-[1.25rem] object-cover"
    />
  )
}

function buildSupportingVariants(
  base: NatureArtworkVariant
): NatureArtworkVariant[] {
  switch (base) {
    case "camp":
      return ["camp", "fireside", "creek", "trail"]
    case "hideaway":
      return ["hideaway", "creek", "canopy", "trail"]
    case "family":
      return ["family", "trail", "creek", "fireside"]
    case "signature":
      return ["signature", "hideaway", "creek", "canopy"]
    default:
      return [base, "creek", "canopy", "trail"]
  }
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  )
}

function ArrowLeft() {
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
      <path d="M19 12H5m7-7-7 7 7 7" />
    </svg>
  )
}
