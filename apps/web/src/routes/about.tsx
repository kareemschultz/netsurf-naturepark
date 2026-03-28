import { createFileRoute, Link } from "@tanstack/react-router";
import { contacts } from "@workspace/shared";
import { AnimatedPageHero } from "../components/AnimatedHeroBg";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Our Story"
        title="About Netsurf Nature Park"
        subtitle="A rainforest retreat on the Soesdyke-Linden Highway — 100% solar powered, zero generators."
      >
        <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold text-white/90 border border-white/25 backdrop-blur-sm" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          ☀️ 100% Solar Powered Eco-Retreat
        </span>
      </AnimatedPageHero>

    <div className="py-12 px-4 min-h-screen">
      <div className="mx-auto max-w-3xl">

        {/* Story */}
        <div className="prose prose-sm max-w-none space-y-5 text-foreground/80 leading-relaxed">
          <p>
            Netsurf Nature Park was born from a simple idea: that the most
            restorative thing you can do is step into a rainforest and stay
            there for a while. Not a sanitised resort. Not a hotel with a view
            of the jungle. The actual jungle, with the sounds, the smells, and
            the blackwater creek running through it.
          </p>

          <p>
            The park sits on the Soesdyke-Linden Highway in Guyana — one of the
            most biodiverse regions on Earth, and one of the least disturbed.
            We chose this location deliberately. The rainforest here is intact,
            the creek is clean, and the night sky is genuinely dark.
          </p>

          <div
            className="rounded-2xl p-6 border-l-4 my-8"
            style={{ backgroundColor: "#FAF6F0", borderColor: "#2D5016" }}
          >
            <p className="text-base font-semibold text-foreground leading-relaxed italic">
              "We wanted a place where people could switch off completely — not
              metaphorically, but literally. No generators, no diesel hum in
              the background. Just solar energy and silence."
            </p>
            <p className="text-sm text-muted-foreground mt-2">— Stephen Thompson, Founder</p>
          </div>

          <p>
            Every unit on the property — the cabins, the camping areas, the
            outdoor kitchen, the lights along the creek path — runs on 100%
            solar power. The same renewable energy technology that powers
            Netsurf's sister company,{" "}
            <a
              href="https://netsurfpower.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2"
              style={{ color: "#2D5016" }}
            >
              Netsurf Power
            </a>
            , is what makes this possible. There are no generators on site, and
            there never will be.
          </p>

          <p>
            The park is small by design. We have four accommodation options,
            which means we never have more than a handful of guests at a time.
            That's not an accident — it's the point. Crowded eco-resorts aren't
            really eco-resorts. We prefer depth over volume.
          </p>

          <h2 className="text-xl font-black text-foreground mt-8 mb-3">
            What to Expect
          </h2>

          <p>
            Expect the unexpected. The blackwater creek changes with the
            seasons. Wildlife appears on its own schedule. Some mornings the
            mist is extraordinary; some nights the stars are overwhelming.
          </p>

          <p>
            What you won't find: air conditioning, room service, or a spa.
            What you will find: birdsong at dawn, fireflies at dusk, and a
            creek that is genuinely one of the most beautiful natural features
            in Guyana.
          </p>

          <p>
            We are a working eco-retreat, not a theme park. The cooking is
            self-catering or on-request. The experience is what you make it.
            We're here to facilitate, not perform.
          </p>
        </div>

        {/* CTA */}
        <div
          className="mt-12 rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-4 justify-between"
          style={{ backgroundColor: "#2D5016" }}
        >
          <div className="text-white text-center sm:text-left">
            <h3 className="font-bold text-lg">Come and see for yourself.</h3>
            <p className="text-white/70 text-sm mt-1">
              Bookings are confirmed via WhatsApp. Stephen responds fast.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/cabins"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-white border border-white/30 hover:bg-white/10 transition-colors"
            >
              View Cabins
            </Link>
            <a
              href={contacts.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#25D366" }}
            >
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
