import { useState } from "react"

import { createFileRoute, Link } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"

import { buildWhatsAppTextLink, faqs } from "@workspace/shared"
import type { FaqItem } from "@workspace/shared"

import { AnimatedPageHero } from "../components/AnimatedHeroBg"
import { BlurFade } from "../components/BlurFade"
import { WhatsAppIcon } from "../components/WhatsAppIcon"

export const Route = createFileRoute("/faq")({
  component: FaqPage,
})

type FaqCategory = FaqItem["category"]

const categoryLabels: Record<FaqCategory | "all", string> = {
  all: "All",
  booking: "Booking",
  stay: "Stay",
  activities: "Activities",
  "getting-there": "Getting There",
  policies: "Policies",
}

const allCategories = ["all", "booking", "stay", "activities", "getting-there", "policies"] as const

function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "all">("all")

  const filtered =
    activeCategory === "all"
      ? faqs
      : faqs.filter((faq) => faq.category === activeCategory)

  return (
    <>
      <AnimatedPageHero
        eyebrow="FAQ"
        title="Frequently Asked Questions"
        subtitle="Everything you need to know before you visit."
      />

      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Category filter */}
          <BlurFade inView>
            <div
              role="tablist"
              aria-label="Filter FAQ by category"
              className="mb-8 flex flex-wrap gap-2"
            >
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5016]/60"
                  style={
                    activeCategory === cat
                      ? { backgroundColor: "#2D5016", color: "#fff", borderColor: "#2D5016" }
                      : { backgroundColor: "transparent", color: "#2D5016", borderColor: "#2D5016" }
                  }
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </BlurFade>

          {/* FAQ accordion */}
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              {filtered.map((faq, i) => (
                <BlurFade key={`${faq.category}-${faq.question}`} delay={i * 0.06} inView>
                  <FaqAccordionItem faq={faq} />
                </BlurFade>
              ))}
            </AnimatePresence>
          </div>

          {/* WhatsApp CTA */}
          <BlurFade delay={0.3} inView>
            <div
              className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl p-7 text-center sm:flex-row sm:text-left"
              style={{ backgroundColor: "#2D5016" }}
            >
              <div className="text-white">
                <h3 className="text-lg font-bold">Still have questions?</h3>
                <p className="mt-1 text-sm text-white/70">
                  Stephen responds personally to every WhatsApp message.
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                <Link
                  to="/contact"
                  className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Contact Us
                </Link>
                <a
                  href={buildWhatsAppTextLink(
                    "Hi! I have a question about Netsurf Nature Park."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <WhatsAppIcon className="h-[15px] w-[15px]" />
                  WhatsApp Us
                </a>
              </div>
            </div>
          </BlurFade>
        </div>
      </div>
    </>
  )
}

function FaqAccordionItem({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2D5016]/60"
      >
        <span className="text-sm font-bold leading-snug text-foreground">
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: "#2D5016" }}
          aria-hidden="true"
        >
          <PlusIcon />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="6" y1="1" x2="6" y2="11" />
      <line x1="1" y1="6" x2="11" y2="6" />
    </svg>
  )
}
