import { createFileRoute, Link, notFound } from "@tanstack/react-router"

import { cabins, formatGYD, whatsappBookingLink } from "@workspace/shared"
import { Badge } from "@workspace/ui/components/badge"

import {
  NatureArtwork,
  type NatureArtworkVariant,
} from "../../components/NatureArtwork"
import { getCabinArtworkVariant } from "../../components/natureArtworkData"

export const Route = createFileRoute("/cabins/$slug")({
  component: CabinDetailPage,
  loader: ({ params }) => {
    const cabin = cabins.find((item) => item.slug === params.slug)
    if (!cabin) {
      throw notFound()
    }

    return { cabin }
  },
})

function CabinDetailPage() {
  const { cabin } = Route.useLoaderData()
  const baseVariant = getCabinArtworkVariant(cabin)
  const supportingVariants = buildSupportingVariants(baseVariant)

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
          <span>/</span>
          <Link
            to="/cabins"
            className="transition-colors hover:text-foreground"
          >
            Cabins
          </Link>
          <span>/</span>
          <span className="font-medium text-foreground">{cabin.name}</span>
        </nav>

        <NatureArtwork
          alt={`${cabin.name} hero illustration at Netsurf Nature Park`}
          variant={baseVariant}
          priority
          className="aspect-[16/9] rounded-[2rem] border-[#C4941A22] bg-[#17330E]"
        />

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
              {cabin.features.map((feature) => (
                <li
                  key={feature}
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
              ))}
            </ul>

            <h2 className="mt-10 text-lg font-bold">A Feel for This Stay</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {supportingVariants.map((variant, index) => (
                <NatureArtwork
                  key={`${variant}-${index}`}
                  alt={`${cabin.name} atmosphere scene ${index + 1}`}
                  variant={variant}
                  className="aspect-[4/3] rounded-[1.25rem] border-[#C4941A18]"
                />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1">
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
                <WhatsAppSVG />
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

function WhatsAppSVG() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.532 5.864L0 24l6.29-1.51A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.733.897.939-3.63-.234-.373A9.818 9.818 0 1112 21.818z" />
    </svg>
  )
}
