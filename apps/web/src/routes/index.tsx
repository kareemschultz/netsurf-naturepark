import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { cabins, features, galleryImages, testimonials, contacts, formatGYD } from "@workspace/shared";
import { Badge } from "@workspace/ui/components/badge";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { AnimateIn, StaggerList, StaggerItem } from "../components/AnimateIn";
import { AnimatedHeroBg } from "../components/AnimatedHeroBg";

export const Route = createFileRoute("/")({
  component: HomePage,
});

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
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */

function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center min-h-[92vh] text-white overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #1E3A0E 0%, #2D5016 40%, #3A6B1E 70%, #1E3A0E 100%)",
      }}
    >
      {/* Animated background layer */}
      <AnimatedHeroBg />

      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Solar badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-white/90 mb-6 backdrop-blur-sm"
        >
          <span>☀️</span>
          <span>100% Solar Powered · Zero Generators</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black leading-tight mb-6 drop-shadow-lg"
        >
          Guyana's Premier
          <br />
          <span style={{ color: "#C4941A" }}>Eco-Retreat</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay: 0.22 }}
          className="text-lg sm:text-xl text-white/80 max-w-xl mx-auto mb-8 leading-relaxed"
        >
          Rainforest. Blackwater Creek. Total Silence.
          <br className="hidden sm:block" />
          {" "}Just off the Soesdyke-Linden Highway — worlds away from everything.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number,number,number,number], delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/book"
              search={{ cabin: undefined }}
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-bold text-white shadow-xl"
              style={{ backgroundColor: "#C4941A" }}
            >
              Reserve Your Stay
              <ArrowRight />
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/cabins"
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-colors backdrop-blur-sm"
            >
              Explore Cabins
              <ArrowRight />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 flex justify-center animate-bounce"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Booking CTA Bar ───────────────────────────────────────────────────── */

function BookingCTABar() {
  return (
    <section className="py-8 px-4" style={{ backgroundColor: "#FAF6F0" }}>
      <div className="mx-auto max-w-4xl">
        <div
          className="rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ backgroundColor: "#2D5016" }}
        >
          <div className="text-white text-center sm:text-left">
            <p className="font-black text-lg leading-tight">Ready to escape the city?</p>
            <p className="text-white/70 text-sm mt-0.5">
              Pick your cabin, choose your dates, and we'll confirm via WhatsApp.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/cabins"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              View Cabins
            </Link>
            <Link
              to="/book"
              search={{ cabin: undefined }}
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 whitespace-nowrap"
              style={{ backgroundColor: "#C4941A" }}
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Cabins Section ────────────────────────────────────────────────────── */

function CabinsSection() {
  return (
    <section className="py-20 px-4" id="cabins">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Where You'll Stay"
          title="Cabins & Camping"
          subtitle="Four ways to sleep under the Guyanese sky — from stargazing campsites to our signature Hansel & Gretel cabin."
        />

        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {cabins.map((cabin) => (
            <StaggerItem key={cabin.slug}>
            <motion.div
              className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-border h-full"
              whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(45,80,22,0.15)" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            >
              {/* Image */}
              <div className="overflow-hidden h-48">
                <motion.div
                  className="h-48 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${cabin.images[0]}'), linear-gradient(160deg, #2D5016 0%, #3A6B1E 100%)`,
                  }}
                  whileHover={{ scale: 1.07 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base leading-tight">{cabin.name}</h3>
                  <Badge
                    variant="secondary"
                    className="text-xs shrink-0 font-semibold"
                    style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                  >
                    {formatGYD(cabin.priceGYD)}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">
                  {cabin.tagline}
                </p>
                <div className="flex gap-2">
                  <Link
                    to="/cabins/$slug"
                    params={{ slug: cabin.slug }}
                    className="flex-1 text-center rounded-lg px-3 py-2 text-xs font-semibold border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Details
                  </Link>
                  <Link
                    to="/book"
                    search={{ cabin: cabin.slug }}
                    className="flex-1 text-center rounded-lg px-3 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#C4941A" }}
                  >
                    Book
                  </Link>
                </div>
              </div>
            </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>

        <AnimateIn delay={0.2} className="text-center mt-10">
          <Link
            to="/cabins"
            className="inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#2D5016" }}
          >
            View All Accommodations
            <ArrowRight />
          </Link>
        </AnimateIn>
      </div>
    </section>
  );
}

/* ─── Features Section ──────────────────────────────────────────────────── */

function FeaturesSection() {
  const iconMap: Record<string, string> = {
    solar: "☀️",
    water: "🏞️",
    fire: "🔥",
    tree: "🌿",
    compass: "🧭",
    map: "📍",
  };

  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#2D5016" }}>
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="What Makes Us Different"
          title="Built for Nature Lovers"
          subtitle="We didn't build a resort — we cleared a few paths and let the rainforest do the rest."
          light
        />

        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <motion.div
                className="rounded-2xl p-6 border border-white/10"
                whileHover={{ backgroundColor: "rgba(255,255,255,0.07)", scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-3xl mb-3">{iconMap[f.icon] ?? "🌿"}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

/* ─── Gallery Section ───────────────────────────────────────────────────── */

function GallerySection() {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          label="Gallery"
          title="See the Park"
          subtitle="A glimpse into what's waiting for you on the Soesdyke-Linden Highway."
        />

        <StaggerList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-12">
          {galleryImages.map((img, i) => (
            <StaggerItem
              key={i}
              className={`rounded-xl overflow-hidden bg-secondary ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
            <motion.div
              className="w-full h-full"
              style={{ minHeight: i === 0 ? 320 : 160 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                style={{ minHeight: "inherit" }}
                onError={(e) => {
                  // Show green placeholder if image not found
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  (e.currentTarget.parentElement as HTMLElement).style.background =
                    "linear-gradient(160deg, #2D5016 0%, #3A6B1E 100%)";
                }}
              />
            </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

/* ─── Testimonials Section ──────────────────────────────────────────────── */

function TestimonialsSection() {
  return (
    <section className="py-20 px-4" style={{ backgroundColor: "#FAF6F0" }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          label="Stories from the Creek"
          title="Guests Who Found Their Peace"
        />

        <StaggerList className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {testimonials.map((t) => (
            <StaggerItem key={t.id}>
              <motion.div
                className="bg-white rounded-2xl p-6 shadow-sm border border-border h-full"
                whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(45,80,22,0.1)" }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <StarIcon key={i} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/80 mb-5 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className="text-xs font-bold text-white"
                      style={{ backgroundColor: "#2D5016" }}
                    >
                      {t.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerList>
      </div>
    </section>
  );
}

/* ─── Getting There ─────────────────────────────────────────────────────── */

function GetThereSection() {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          label="Location"
          title="Getting to Netsurf"
          subtitle="We're on the Soesdyke-Linden Highway — a scenic drive from Georgetown through Guyanese countryside."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 items-center">
          {/* Map embed */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-border aspect-video">
            <iframe
              title="Netsurf Nature Park Location"
              src={`https://maps.google.com/maps?q=6.0870307,-58.2677041&z=14&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Info */}
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#FAF6F0" }}>
                🚗
              </div>
              <div>
                <h4 className="font-bold mb-1">By Car</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Head south from Georgetown on the Soesdyke-Linden Highway. We're clearly signposted on the right-hand side.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#FAF6F0" }}>
                🚐
              </div>
              <div>
                <h4 className="font-bold mb-1">Transport from Georgetown</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We offer door-to-door pickup and drop-off from Georgetown. <strong>GYD $5,000</strong> per trip — just add it when booking.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#FAF6F0" }}>
                📍
              </div>
              <div>
                <h4 className="font-bold mb-1">GPS Coordinates</h4>
                <p className="text-sm text-muted-foreground">
                  6.0870307, -58.2677041
                </p>
                <a
                  href={contacts.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold mt-1 inline-block"
                  style={{ color: "#2D5016" }}
                >
                  Open in Google Maps →
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#FAF6F0" }}>
                💬
              </div>
              <div>
                <h4 className="font-bold mb-1">Questions? WhatsApp us.</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Stephen responds quickly — don't hesitate to reach out.
                </p>
                <a
                  href={contacts.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppSVG />
                  Chat Now
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Shared primitives ─────────────────────────────────────────────────── */

function SectionHeader({
  label,
  title,
  subtitle,
  light = false,
}: {
  label?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <AnimateIn className="text-center max-w-xl mx-auto">
      {label && (
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            light ? "text-white/50" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
      )}
      <h2
        className={`mt-2 text-3xl sm:text-4xl font-black leading-tight ${
          light ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-3 text-sm leading-relaxed ${
            light ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          {subtitle}
        </p>
      )}
    </AnimateIn>
  );
}

function ArrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#C4941A" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
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
