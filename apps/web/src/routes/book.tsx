import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react"

import { createFileRoute, Link } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import {
  addDays,
  differenceInCalendarDays,
  format,
  startOfToday,
} from "date-fns"
import { DayPicker, type DateRange } from "react-day-picker"

import {
  addOns,
  buildWhatsAppBookingLink,
  cabins,
  formatGYD,
  type BookingRequest,
  type Cabin,
} from "@workspace/shared"

import { NatureArtwork } from "../components/NatureArtwork"
import { getCabinArtworkVariant } from "../components/natureArtworkData"
import { WhatsAppIcon } from "../components/WhatsAppIcon"

const API_URL = import.meta.env.VITE_API_URL ?? ""

import "react-day-picker/style.css"

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    cabin: typeof search.cabin === "string" ? search.cabin : undefined,
  }),
  component: BookPage,
})

type Step = 1 | 2 | 3 | 4 | 5

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; bookingId: number }
  | { status: "error"; message: string }

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Cabin" },
  { n: 2, label: "Dates" },
  { n: 3, label: "Extras" },
  { n: 4, label: "Details" },
  { n: 5, label: "Confirm" },
]
const EXTRA_CATEGORIES = [
  { key: "meal", label: "Meals" },
  { key: "activity", label: "Activities" },
  { key: "transport", label: "Transport" },
] as const

function BookPage() {
  const { cabin: cabinParam } = Route.useSearch()
  const initialCabin = useMemo(
    () => cabins.find((cabin) => cabin.slug === cabinParam) ?? null,
    [cabinParam]
  )
  const stepHeadingRef = useRef<HTMLHeadingElement | null>(null)

  const [step, setStep] = useState<Step>(initialCabin ? 2 : 1)
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(initialCabin)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [guests, setGuests] = useState(1)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  })

  const nights =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from)
      : 0

  const addOnTotal = useMemo(
    () =>
      addOns
        .filter((item) => selectedAddOns.includes(item.slug))
        .reduce((sum, item) => sum + item.priceGYD, 0),
    [selectedAddOns]
  )

  const total = selectedCabin
    ? selectedCabin.priceGYD * Math.max(nights, 1) + addOnTotal
    : 0

  const contactDetails = [whatsapp.trim(), email.trim()]
    .filter(Boolean)
    .join(" | ")

  const whatsappLink =
    selectedCabin && dateRange?.from && dateRange?.to
      ? (() => {
          const bookingRequest: BookingRequest = {
            cabin: selectedCabin,
            checkIn: dateRange.from,
            checkOut: dateRange.to,
            guests,
            addOnSlugs: selectedAddOns,
            name,
            contact: contactDetails,
            notes,
          }
          return buildWhatsAppBookingLink(bookingRequest)
        })()
      : "#"

  const hasUnsavedProgress =
    submitState.status !== "success" &&
    Boolean(
      selectedCabin ||
      dateRange?.from ||
      dateRange?.to ||
      selectedAddOns.length > 0 ||
      name.trim() ||
      whatsapp.trim() ||
      email.trim() ||
      notes.trim()
    )

  useEffect(() => {
    if (!cabinParam) {
      return
    }

    if (initialCabin) {
      setSelectedCabin(initialCabin)
      setStep((current) => (current === 1 ? 2 : current))
    }
  }, [cabinParam, initialCabin])

  useEffect(() => {
    stepHeadingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (!hasUnsavedProgress) {
      return
    }

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [hasUnsavedProgress])

  const toggleAddOn = useCallback((slug: string) => {
    setSelectedAddOns((previous) =>
      previous.includes(slug)
        ? previous.filter((value) => value !== slug)
        : [...previous, slug]
    )
  }, [])

  async function submitBooking() {
    if (!selectedCabin || !dateRange?.from || !dateRange?.to) {
      return
    }

    if (!API_URL) {
      setSubmitState({
        status: "error",
        message:
          "Booking API is not configured yet. Please use WhatsApp to submit this booking",
      })
      return
    }

    setSubmitState({ status: "loading" })

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cabinSlug: selectedCabin.slug,
          checkIn: format(dateRange.from, "yyyy-MM-dd"),
          checkOut: format(dateRange.to, "yyyy-MM-dd"),
          guests,
          addOnSlugs: selectedAddOns,
          name,
          contact: contactDetails,
          notes,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          (error as { error?: string }).error ?? `Error ${response.status}`
        )
      }

      const data = (await response.json()) as { id: number }
      setSubmitState({ status: "success", bookingId: data.id })
    } catch (error) {
      setSubmitState({
        status: "error",
        message: (error as Error).message,
      })
    }
  }

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="mb-4 inline-block text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to Netsurf Nature Park
          </Link>
          <h1 className="text-3xl font-black">Reserve Your Stay</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your stay, share your details, and get a personal WhatsApp
            confirmation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <StepProgress currentStep={step} />

            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 && (
                    <StepCabin
                      headingRef={stepHeadingRef}
                      selected={selectedCabin}
                      onSelect={(cabin) => {
                        setSelectedCabin(cabin)
                        setStep(2)
                      }}
                    />
                  )}
                  {step === 2 && (
                    <StepDates
                      headingRef={stepHeadingRef}
                      cabin={selectedCabin}
                      range={dateRange}
                      onChange={setDateRange}
                      onBack={() => setStep(1)}
                      onNext={() => setStep(3)}
                      nights={nights}
                    />
                  )}
                  {step === 3 && (
                    <StepExtras
                      headingRef={stepHeadingRef}
                      cabin={selectedCabin}
                      guests={guests}
                      setGuests={setGuests}
                      selectedAddOns={selectedAddOns}
                      toggleAddOn={toggleAddOn}
                      onBack={() => setStep(2)}
                      onNext={() => setStep(4)}
                    />
                  )}
                  {step === 4 && (
                    <StepDetails
                      headingRef={stepHeadingRef}
                      name={name}
                      setName={setName}
                      whatsapp={whatsapp}
                      setWhatsapp={setWhatsapp}
                      email={email}
                      setEmail={setEmail}
                      notes={notes}
                      setNotes={setNotes}
                      onBack={() => setStep(3)}
                      onNext={() => setStep(5)}
                    />
                  )}
                  {step === 5 && (
                    <StepConfirm
                      headingRef={stepHeadingRef}
                      cabin={selectedCabin}
                      range={dateRange}
                      nights={nights}
                      guests={guests}
                      selectedAddOns={selectedAddOns}
                      name={name}
                      whatsapp={whatsapp}
                      email={email}
                      notes={notes}
                      total={total}
                      whatsappLink={whatsappLink}
                      submitState={submitState}
                      onSubmit={submitBooking}
                      onBack={() => setStep(4)}
                      onEditStep={setStep}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <BookingSidebar
            cabin={selectedCabin}
            nights={nights}
            guests={guests}
            selectedAddOns={selectedAddOns}
            total={total}
          />
        </div>
      </div>
    </div>
  )
}

function StepProgress({ currentStep }: { currentStep: Step }) {
  return (
    <ol
      className="flex items-center gap-0 overflow-x-auto pb-1"
      aria-label="Booking steps"
    >
      {STEPS.map((step, index) => (
        <li key={step.n} className="flex min-w-[4.25rem] flex-1 items-center">
          <div className="flex flex-1 flex-col items-center">
            <div
              aria-current={currentStep === step.n ? "step" : undefined}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                currentStep >= step.n
                  ? "text-white"
                  : "bg-muted text-muted-foreground"
              }`}
              style={
                currentStep >= step.n
                  ? { backgroundColor: "#2D5016" }
                  : undefined
              }
            >
              {currentStep > step.n ? "✓" : step.n}
            </div>
            <span
              className={`mt-1 text-[10px] font-semibold tracking-wide uppercase ${
                currentStep === step.n
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              aria-hidden="true"
              className="mx-1 mb-4 h-0.5 flex-1"
              style={{
                backgroundColor: currentStep > step.n ? "#2D5016" : "#e5e7eb",
              }}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

function StepCabin({
  headingRef,
  selected,
  onSelect,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  selected: Cabin | null
  onSelect: (cabin: Cabin) => void
}) {
  return (
    <div className="p-6 md:p-8">
      <StepHeader
        headingRef={headingRef}
        title="Choose Your Cabin"
        subtitle="Pick the stay that fits your group, then we'll move into dates and extras."
      />
      <div className="mt-5 space-y-3">
        {cabins.map((cabin) => (
          <button
            key={cabin.slug}
            type="button"
            onClick={() => onSelect(cabin)}
            aria-pressed={selected?.slug === cabin.slug}
            className={`flex w-full gap-4 rounded-[1.25rem] border-2 p-4 text-left transition-colors ${
              selected?.slug === cabin.slug
                ? "border-[#2D5016] bg-[#2D5016]/5"
                : "border-border hover:border-[#2D5016]/35"
            }`}
          >
            <NatureArtwork
              alt={`${cabin.name} illustrated cabin preview`}
              variant={getCabinArtworkVariant(cabin)}
              className="h-20 w-24 shrink-0 rounded-[1rem] border-[#C4941A22]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold">{cabin.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                >
                  {formatGYD(cabin.priceGYD)} / night
                </span>
                <span className="text-xs text-muted-foreground">
                  Up to {cabin.maxGuests} guest
                  {cabin.maxGuests !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {cabin.tagline}
              </p>
            </div>
            <span
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                selected?.slug === cabin.slug
                  ? "border-[#2D5016] bg-[#2D5016] text-white"
                  : "border-muted-foreground/30 text-transparent"
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function StepDates({
  headingRef,
  cabin,
  range,
  onChange,
  onBack,
  onNext,
  nights,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  cabin: Cabin | null
  range: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  onBack: () => void
  onNext: () => void
  nights: number
}) {
  const today = startOfToday()
  const canContinue = Boolean(range?.from && range?.to && nights >= 1)

  return (
    <div className="p-6 md:p-8">
      <StepHeader
        headingRef={headingRef}
        title="Choose Your Dates"
        subtitle={
          cabin ? `${cabin.name} — ${formatGYD(cabin.priceGYD)} per night` : ""
        }
      />
      <div className="mt-2 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
        Check-in starts tomorrow so we have time to confirm your stay properly.
      </div>
      <div className="mt-5 flex justify-center">
        <div className="rdp-brand">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            disabled={{ before: addDays(today, 1) }}
            numberOfMonths={1}
            showOutsideDays={false}
          />
        </div>
      </div>
      {range?.from && range?.to && (
        <div
          className="mt-4 rounded-xl p-3 text-center text-sm font-medium text-white"
          style={{ backgroundColor: "#2D5016" }}
        >
          {format(range.from, "d MMM")} → {format(range.to, "d MMM yyyy")} ·{" "}
          {nights} night
          {nights !== 1 ? "s" : ""} ·{" "}
          {cabin && formatGYD(cabin.priceGYD * nights)}
        </div>
      )}
      <StepNav onBack={onBack} onNext={onNext} canNext={canContinue} />
    </div>
  )
}

function StepExtras({
  headingRef,
  cabin,
  guests,
  setGuests,
  selectedAddOns,
  toggleAddOn,
  onBack,
  onNext,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  cabin: Cabin | null
  guests: number
  setGuests: (count: number) => void
  selectedAddOns: string[]
  toggleAddOn: (slug: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const maxGuests = cabin?.maxGuests ?? 6
  const addOnsByCategory = useMemo(
    () =>
      EXTRA_CATEGORIES.map(({ key, label }) => ({
        key,
        label,
        items: addOns.filter((item) => item.category === key),
      })),
    []
  )

  return (
    <div className="p-6 md:p-8">
      <StepHeader
        headingRef={headingRef}
        title="Guests & Add-ons"
        subtitle="Lock in your group size and add anything extra before checkout."
      />

      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold">
          Number of Guests
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Decrease guest count"
            onClick={() => setGuests(Math.max(1, guests - 1))}
            disabled={guests <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold transition-colors hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30"
          >
            -
          </button>
          <span className="w-8 text-center text-2xl font-black">{guests}</span>
          <button
            type="button"
            aria-label="Increase guest count"
            onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
            disabled={guests >= maxGuests}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-border text-lg font-bold transition-colors hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30"
          >
            +
          </button>
          <span className="text-xs text-muted-foreground">
            (max {maxGuests})
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {addOnsByCategory.map(({ key, label, items }) => {
          if (items.length === 0) {
            return null
          }

          return (
            <div key={key}>
              <p className="mb-2 text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {label}
              </p>
              <div className="space-y-2">
                {items.map((addon) => {
                  const checked = selectedAddOns.includes(addon.slug)

                  return (
                    <button
                      key={addon.slug}
                      type="button"
                      onClick={() => toggleAddOn(addon.slug)}
                      aria-pressed={checked}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                        checked
                          ? "border-[#2D5016] bg-[#2D5016]/5"
                          : "border-border hover:border-[#2D5016]/35"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                          checked
                            ? "border-[#2D5016] bg-[#2D5016] text-white"
                            : "border-muted-foreground/40 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-semibold">
                          {addon.name}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatGYD(addon.priceGYD)}
                        </span>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {addon.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {selectedAddOns.length > 0 && (
        <div className="mt-4 text-right text-sm text-muted-foreground">
          Add-ons subtotal:{" "}
          <strong className="text-foreground">
            {formatGYD(
              addOns
                .filter((item) => selectedAddOns.includes(item.slug))
                .reduce((sum, item) => sum + item.priceGYD, 0)
            )}
          </strong>
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} canNext />
    </div>
  )
}

function StepDetails({
  headingRef,
  name,
  setName,
  whatsapp,
  setWhatsapp,
  email,
  setEmail,
  notes,
  setNotes,
  onBack,
  onNext,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  name: string
  setName: (value: string) => void
  whatsapp: string
  setWhatsapp: (value: string) => void
  email: string
  setEmail: (value: string) => void
  notes: string
  setNotes: (value: string) => void
  onBack: () => void
  onNext: () => void
}) {
  const canNext = name.trim().length > 1 && whatsapp.trim().length > 6

  return (
    <div className="p-6 md:p-8">
      <StepHeader
        headingRef={headingRef}
        title="Your Details"
        subtitle="Share the best number for WhatsApp replies and anything we should know before arrival."
      />
      <div className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="guest-name"
            className="mb-1.5 block text-sm font-semibold"
          >
            Full Name *
          </label>
          <input
            id="guest-name"
            name="fullName"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Maria Gonzalez…"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors outline-none focus:border-[#2D5016]"
          />
        </div>

        <div>
          <label
            htmlFor="guest-whatsapp"
            className="mb-1.5 block text-sm font-semibold"
          >
            WhatsApp Number *
          </label>
          <input
            id="guest-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            required
            aria-required="true"
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="Include your country code…"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors outline-none focus:border-[#2D5016]"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This is where we send availability confirmation and payment
            instructions.
          </p>
        </div>

        <div>
          <label
            htmlFor="guest-email"
            className="mb-1.5 block text-sm font-semibold"
          >
            Email{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <input
            id="guest-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="For a backup contact…"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors outline-none focus:border-[#2D5016]"
          />
        </div>

        <div>
          <label
            htmlFor="guest-notes"
            className="mb-1.5 block text-sm font-semibold"
          >
            Special Requests{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </label>
          <textarea
            id="guest-notes"
            name="notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Dietary needs, arrival timing, accessibility notes…"
            rows={4}
            className="w-full resize-none rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors outline-none focus:border-[#2D5016]"
          />
        </div>
      </div>
      <StepNav
        onBack={onBack}
        onNext={onNext}
        canNext={canNext}
        nextLabel="Review Booking"
      />
    </div>
  )
}

function StepConfirm({
  headingRef,
  cabin,
  range,
  nights,
  guests,
  selectedAddOns,
  name,
  whatsapp,
  email,
  notes,
  total,
  whatsappLink,
  submitState,
  onSubmit,
  onBack,
  onEditStep,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  cabin: Cabin | null
  range: DateRange | undefined
  nights: number
  guests: number
  selectedAddOns: string[]
  name: string
  whatsapp: string
  email: string
  notes: string
  total: number
  whatsappLink: string
  submitState: SubmitState
  onSubmit: () => void
  onBack: () => void
  onEditStep: (step: Step) => void
}) {
  const chosenAddOns = addOns.filter((item) =>
    selectedAddOns.includes(item.slug)
  )

  if (submitState.status === "success") {
    return (
      <div className="p-6 text-center md:p-8" aria-live="polite">
        <div className="mb-4 text-5xl" aria-hidden="true">
          +
        </div>
        <h2 className="mb-2 text-2xl font-black">Booking Received</h2>
        <p className="mb-1 text-sm text-muted-foreground">
          Your request #{submitState.bookingId} has been sent to Stephen.
        </p>
        <p className="mb-7 text-sm text-muted-foreground">
          You can follow up on WhatsApp right away, but we'll usually confirm
          within a few hours.
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Follow up on WhatsApp"
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          <WhatsAppIcon className="h-4 w-4" />
          Follow Up on WhatsApp
        </a>
        <div className="mt-5">
          <Link
            to="/"
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <StepHeader
        headingRef={headingRef}
        title="Review & Confirm"
        subtitle="Everything look right? We'll send this straight to Stephen for confirmation."
      />

      <div className="mt-5 space-y-3">
        <SummaryRow
          label="Cabin"
          value={cabin?.name ?? "-"}
          onEdit={() => onEditStep(1)}
        />
        <SummaryRow
          label="Dates"
          value={
            range?.from && range?.to
              ? `${format(range.from, "d MMM")} - ${format(range.to, "d MMM yyyy")} (${nights} night${nights !== 1 ? "s" : ""})`
              : "-"
          }
          onEdit={() => onEditStep(2)}
        />
        <SummaryRow
          label="Guests"
          value={`${guests} guest${guests !== 1 ? "s" : ""}`}
          onEdit={() => onEditStep(3)}
        />
        <SummaryRow
          label="Add-ons"
          value={
            chosenAddOns.length > 0
              ? chosenAddOns.map((item) => item.name).join(", ")
              : "None"
          }
          onEdit={() => onEditStep(3)}
        />
        <SummaryRow label="Name" value={name} onEdit={() => onEditStep(4)} />
        <SummaryRow
          label="WhatsApp"
          value={whatsapp}
          onEdit={() => onEditStep(4)}
        />
        {email.trim() && (
          <SummaryRow
            label="Email"
            value={email}
            onEdit={() => onEditStep(4)}
          />
        )}
        {notes.trim() && (
          <SummaryRow
            label="Notes"
            value={notes}
            onEdit={() => onEditStep(4)}
          />
        )}
      </div>

      <div
        className="mt-5 flex items-center justify-between rounded-xl p-4"
        style={{ backgroundColor: "#FAF6F0", border: "1px solid #C4941A44" }}
      >
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            Estimated Total
          </p>
          <p
            className="mt-0.5 text-2xl font-black"
            style={{ color: "#2D5016" }}
          >
            {formatGYD(total)}
          </p>
        </div>
        <p className="max-w-[160px] text-right text-xs leading-relaxed text-muted-foreground">
          No upfront payment. Final confirmation comes first.
        </p>
      </div>

      <div className="mt-4 rounded-2xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
        We'll confirm availability, then share payment instructions by WhatsApp.
      </div>

      {submitState.status === "error" && (
        <div
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          aria-live="polite"
        >
          {submitState.message}. You can still{" "}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline"
          >
            send this booking on WhatsApp
          </a>{" "}
          instead.
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitState.status === "loading"}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#2D5016" }}
      >
        {submitState.status === "loading"
          ? "Sending..."
          : "Send Booking Request"}
      </button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Or{" "}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
          style={{ color: "#25D366" }}
        >
          send directly via WhatsApp
        </a>
      </p>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          ← Edit details
        </button>
      </div>
    </div>
  )
}

function BookingSidebar({
  cabin,
  nights,
  guests,
  selectedAddOns,
  total,
}: {
  cabin: Cabin | null
  nights: number
  guests: number
  selectedAddOns: string[]
  total: number
}) {
  const addOnItems = addOns.filter((item) => selectedAddOns.includes(item.slug))

  return (
    <aside className="lg:pt-14">
      <div className="sticky top-24 rounded-[1.75rem] border border-border bg-white p-5 shadow-sm">
        <p className="text-xs font-bold tracking-[0.22em] text-muted-foreground uppercase">
          Booking Summary
        </p>

        {cabin ? (
          <>
            <NatureArtwork
              alt={`${cabin.name} booking summary artwork`}
              variant={getCabinArtworkVariant(cabin)}
              className="mt-4 aspect-[5/4] rounded-[1.25rem] border-[#C4941A18]"
            />
            <div className="mt-4">
              <h2 className="font-bold">{cabin.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {cabin.tagline}
              </p>
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-[1.25rem] bg-secondary px-4 py-5 text-sm text-muted-foreground">
            Choose a cabin to start building your trip.
          </div>
        )}

        <dl className="mt-5 space-y-3 text-sm">
          <SidebarDetail label="Guests" value={`${guests}`} />
          <SidebarDetail
            label="Nights"
            value={nights > 0 ? `${nights}` : "-"}
          />
          <SidebarDetail
            label="Add-ons"
            value={addOnItems.length > 0 ? `${addOnItems.length}` : "0"}
          />
          <SidebarDetail
            label="Estimated Total"
            value={cabin ? formatGYD(total) : "-"}
            bold
          />
        </dl>

        <div className="mt-5 rounded-2xl bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          Your spot is only confirmed after Stephen replies on WhatsApp. No
          hidden checkout fees.
        </div>
      </div>
    </aside>
  )
}

function SidebarDetail({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={bold ? "font-bold" : "font-semibold"}>{value}</dd>
    </div>
  )
}

function StepHeader({
  headingRef,
  title,
  subtitle,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-black">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

function StepNav({
  onBack,
  onNext,
  canNext,
  nextLabel = "Continue",
}: {
  onBack: () => void
  onNext: () => void
  canNext: boolean
  nextLabel?: string
}) {
  return (
    <div className="mt-7 flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold transition-colors hover:border-foreground"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="flex-[2] rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "#2D5016" }}
      >
        {nextLabel}
      </button>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string
  onEdit: () => void
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border py-2.5 last:border-0">
      <span className="w-24 shrink-0 pt-0.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="flex-1 text-sm leading-relaxed">{value}</span>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 text-xs font-semibold hover:underline"
        style={{ color: "#2D5016" }}
      >
        Edit
      </button>
    </div>
  )
}
