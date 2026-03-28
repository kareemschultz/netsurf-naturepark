import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { cabins, formatGYD, whatsappBookingLink } from "@workspace/shared";

import { Badge } from "@workspace/ui/components/badge";

export const Route = createFileRoute("/cabins/$slug")({
  component: CabinDetailPage,
  loader: ({ params }) => {
    const cabin = cabins.find((c) => c.slug === params.slug);
    if (!cabin) throw notFound();
    return { cabin };
  },
});

function CabinDetailPage() {
  const { cabin } = Route.useLoaderData();

  return (
    <div className="py-16 px-4 min-h-screen">
      <div className="mx-auto max-w-5xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/cabins" className="hover:text-foreground transition-colors">
            Cabins
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{cabin.name}</span>
        </div>

        {/* Hero image */}
        <div
          className="w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-8 bg-cover bg-center"
          style={{
            backgroundImage: `url('${cabin.images[0]}'), linear-gradient(160deg, #2D5016 0%, #3A6B1E 100%)`,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <h1 className="text-3xl font-black">{cabin.name}</h1>
              <Badge
                className="font-bold"
                style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
              >
                Up to {cabin.maxGuests} guests
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-8">
              {cabin.description}
            </p>

            <h2 className="font-bold text-lg mb-4">What's Included</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10">
              {cabin.features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                    style={{ backgroundColor: "#2D5016" }}
                  >
                    ✓
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            {/* Photo grid */}
            {cabin.images.length > 1 && (
              <>
                <h2 className="font-bold text-lg mb-4">Photos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {cabin.images.map((src, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden h-40 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${src}'), linear-gradient(160deg, #2D5016 0%, #3A6B1E 100%)`,
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Booking sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="text-center mb-5">
                <div className="text-3xl font-black" style={{ color: "#2D5016" }}>
                  {formatGYD(cabin.priceGYD)}
                </div>
                <div className="text-sm text-muted-foreground">per night</div>
              </div>

              <Link
                to="/book"
                search={{ cabin: cabin.slug }}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white mb-3 transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#2D5016" }}
              >
                Reserve This Cabin
              </Link>

              <a
                href={whatsappBookingLink(cabin)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 font-semibold text-sm mb-3 transition-opacity hover:opacity-90 border-2"
                style={{ borderColor: "#25D366", color: "#25D366" }}
              >
                <WhatsAppSVG />
                Quick WhatsApp
              </a>

              <p className="text-xs text-muted-foreground text-center leading-relaxed mb-5">
                Stephen confirms within a few hours. Payment by bank transfer.
              </p>

              <div className="border-t border-border pt-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max guests</span>
                  <span className="font-semibold">{cabin.maxGuests}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-semibold">Bank transfer</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Confirmation</span>
                  <span className="font-semibold">Within 24 hrs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="mt-12">
          <Link
            to="/cabins"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: "#2D5016" }}
          >
            ← Back to all cabins
          </Link>
        </div>
      </div>
    </div>
  );
}

function WhatsAppSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.132.558 4.13 1.532 5.864L0 24l6.29-1.51A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.369l-.36-.214-3.733.897.939-3.63-.234-.373A9.818 9.818 0 1112 21.818z"/>
    </svg>
  );
}
