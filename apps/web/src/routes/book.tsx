import { useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { DayPicker, type DateRange } from "react-day-picker";
import { format, differenceInCalendarDays, addDays, startOfToday } from "date-fns";
import {
  cabins,
  addOns,
  formatGYD,
  buildWhatsAppBookingLink,
  type Cabin,
  type BookingRequest,
} from "@workspace/shared";

const API_URL = import.meta.env.VITE_API_URL ?? "";
import "react-day-picker/style.css";

// ─── Route ───────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    cabin: typeof search.cabin === "string" ? search.cabin : undefined,
  }),
  component: BookPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "Cabin" },
  { n: 2, label: "Dates" },
  { n: 3, label: "Extras" },
  { n: 4, label: "Details" },
  { n: 5, label: "Confirm" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

function BookPage() {
  const { cabin: cabinParam } = Route.useSearch();

  const [step, setStep] = useState<Step>(cabinParam ? 2 : 1);
  const [selectedCabin, setSelectedCabin] = useState<Cabin | null>(
    cabins.find((c) => c.slug === cabinParam) ?? null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [guests, setGuests] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");

  const nights =
    dateRange?.from && dateRange?.to
      ? differenceInCalendarDays(dateRange.to, dateRange.from)
      : 0;

  const addOnTotal = addOns
    .filter((a) => selectedAddOns.includes(a.slug))
    .reduce((s, a) => s + a.priceGYD, 0);

  const total = selectedCabin ? selectedCabin.priceGYD * Math.max(nights, 1) + addOnTotal : 0;

  const toggleAddOn = useCallback((slug: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  const [submitState, setSubmitState] = useState<
    { status: "idle" } | { status: "loading" } | { status: "success"; bookingId: number } | { status: "error"; message: string }
  >({ status: "idle" });

  const whatsappLink =
    selectedCabin && dateRange?.from && dateRange?.to
      ? buildWhatsAppBookingLink({
          cabin: selectedCabin,
          checkIn: dateRange.from,
          checkOut: dateRange.to,
          guests,
          addOnSlugs: selectedAddOns,
          name,
          contact,
          notes,
        } as BookingRequest)
      : "#";

  async function submitBooking() {
    if (!selectedCabin || !dateRange?.from || !dateRange?.to) return;
    setSubmitState({ status: "loading" });
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cabinSlug: selectedCabin.slug,
          checkIn: format(dateRange.from, "yyyy-MM-dd"),
          checkOut: format(dateRange.to, "yyyy-MM-dd"),
          guests,
          addOnSlugs: selectedAddOns,
          name,
          contact,
          notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Error ${res.status}`);
      }
      const data = await res.json() as { id: number };
      setSubmitState({ status: "success", bookingId: data.id });
    } catch (err) {
      setSubmitState({ status: "error", message: (err as Error).message });
    }
  }

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: "#FAF6F0" }}>
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground mb-4 inline-block">
            ← Back to Netsurf Nature Park
          </Link>
          <h1 className="text-3xl font-black mt-1">Reserve Your Stay</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete the steps below — we'll confirm via WhatsApp.
          </p>
        </div>

        {/* Progress bar */}
        <StepProgress currentStep={step} />

        {/* Step panels */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] }}
            >
              {step === 1 && (
                <StepCabin
                  selected={selectedCabin}
                  onSelect={(c) => { setSelectedCabin(c); setStep(2); }}
                />
              )}
              {step === 2 && (
                <StepDates
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
                  name={name}
                  setName={setName}
                  contact={contact}
                  setContact={setContact}
                  notes={notes}
                  setNotes={setNotes}
                  onBack={() => setStep(3)}
                  onNext={() => setStep(5)}
                />
              )}
              {step === 5 && (
                <StepConfirm
                  cabin={selectedCabin}
                  range={dateRange}
                  nights={nights}
                  guests={guests}
                  selectedAddOns={selectedAddOns}
                  name={name}
                  contact={contact}
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
    </div>
  );
}

// ─── Step Progress ────────────────────────────────────────────────────────────

function StepProgress({ currentStep }: { currentStep: Step }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                currentStep > s.n
                  ? "text-white"
                  : currentStep === s.n
                  ? "text-white"
                  : "bg-muted text-muted-foreground"
              }`}
              style={
                currentStep >= s.n
                  ? { backgroundColor: "#2D5016" }
                  : undefined
              }
            >
              {currentStep > s.n ? "✓" : s.n}
            </div>
            <span
              className={`mt-1 text-[10px] font-semibold uppercase tracking-wide ${
                currentStep === s.n ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className="h-0.5 flex-1 mb-4 mx-1"
              style={{ backgroundColor: currentStep > s.n ? "#2D5016" : "#e5e7eb" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Choose Cabin ─────────────────────────────────────────────────────

function StepCabin({
  selected,
  onSelect,
}: {
  selected: Cabin | null;
  onSelect: (c: Cabin) => void;
}) {
  return (
    <div className="p-6 md:p-8">
      <StepHeader title="Choose Your Cabin" subtitle="Select the accommodation that suits your group." />
      <div className="space-y-3 mt-5">
        {cabins.map((cabin) => (
          <button
            key={cabin.slug}
            onClick={() => onSelect(cabin)}
            className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:shadow-md flex gap-4 items-start ${
              selected?.slug === cabin.slug
                ? "border-[#2D5016] bg-[#2D5016]/5"
                : "border-border hover:border-[#2D5016]/40"
            }`}
          >
            {/* Thumbnail */}
            <div
              className="w-16 h-16 rounded-lg shrink-0 bg-cover bg-center"
              style={{
                backgroundImage: `url('${cabin.images[0]}'), linear-gradient(135deg, #2D5016, #4a7c28)`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm">{cabin.name}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FAF6F0", color: "#2D5016" }}
                >
                  {formatGYD(cabin.priceGYD)} / night
                </span>
                <span className="text-xs text-muted-foreground">
                  Up to {cabin.maxGuests} guests
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {cabin.tagline}
              </p>
            </div>
            <div
              className={`mt-1 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected?.slug === cabin.slug
                  ? "border-[#2D5016] bg-[#2D5016]"
                  : "border-muted-foreground/30"
              }`}
            >
              {selected?.slug === cabin.slug && (
                <span className="text-white text-[10px]">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Choose Dates ─────────────────────────────────────────────────────

function StepDates({
  cabin,
  range,
  onChange,
  onBack,
  onNext,
  nights,
}: {
  cabin: Cabin | null;
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  onBack: () => void;
  onNext: () => void;
  nights: number;
}) {
  const today = startOfToday();
  const canContinue = range?.from && range?.to && nights >= 1;

  return (
    <div className="p-6 md:p-8">
      <StepHeader
        title="Choose Your Dates"
        subtitle={cabin ? `${cabin.name} — ${formatGYD(cabin.priceGYD)} per night` : ""}
      />
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
          className="mt-4 rounded-xl p-3 text-sm text-center font-medium"
          style={{ backgroundColor: "#2D5016", color: "white" }}
        >
          {format(range.from, "d MMM")} → {format(range.to, "d MMM yyyy")} &nbsp;·&nbsp;{" "}
          {nights} night{nights !== 1 ? "s" : ""} &nbsp;·&nbsp;{" "}
          {cabin && formatGYD(cabin.priceGYD * nights)}
        </div>
      )}
      <StepNav onBack={onBack} onNext={onNext} canNext={!!canContinue} />
    </div>
  );
}

// ─── Step 3: Guests & Extras ──────────────────────────────────────────────────

function StepExtras({
  cabin,
  guests,
  setGuests,
  selectedAddOns,
  toggleAddOn,
  onBack,
  onNext,
}: {
  cabin: Cabin | null;
  guests: number;
  setGuests: (n: number) => void;
  selectedAddOns: string[];
  toggleAddOn: (slug: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const maxGuests = cabin?.maxGuests ?? 6;

  const categories = [
    { key: "meal", label: "Meals" },
    { key: "activity", label: "Activities" },
    { key: "transport", label: "Transport" },
  ] as const;

  return (
    <div className="p-6 md:p-8">
      <StepHeader title="Guests & Add-ons" subtitle="How many guests, and anything extra?" />

      {/* Guest counter */}
      <div className="mt-5">
        <label className="text-sm font-semibold block mb-2">Number of Guests</label>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setGuests(Math.max(1, guests - 1))}
            disabled={guests <= 1}
            className="w-9 h-9 rounded-full border-2 border-border font-bold text-lg flex items-center justify-center hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30 transition-colors"
          >
            −
          </button>
          <span className="text-2xl font-black w-8 text-center">{guests}</span>
          <button
            onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
            disabled={guests >= maxGuests}
            className="w-9 h-9 rounded-full border-2 border-border font-bold text-lg flex items-center justify-center hover:border-[#2D5016] hover:text-[#2D5016] disabled:opacity-30 transition-colors"
          >
            +
          </button>
          <span className="text-xs text-muted-foreground">(max {maxGuests})</span>
        </div>
      </div>

      {/* Add-ons by category */}
      <div className="mt-6 space-y-5">
        {categories.map(({ key, label }) => {
          const items = addOns.filter((a) => a.category === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {label}
              </p>
              <div className="space-y-2">
                {items.map((addon) => {
                  const checked = selectedAddOns.includes(addon.slug);
                  return (
                    <button
                      key={addon.slug}
                      onClick={() => toggleAddOn(addon.slug)}
                      className={`w-full text-left rounded-xl border-2 p-3 flex items-center gap-3 transition-all ${
                        checked
                          ? "border-[#2D5016] bg-[#2D5016]/5"
                          : "border-border hover:border-[#2D5016]/40"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          checked ? "border-[#2D5016] bg-[#2D5016]" : "border-muted-foreground/40"
                        }`}
                      >
                        {checked && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold">{addon.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatGYD(addon.priceGYD)}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {addon.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedAddOns.length > 0 && (
        <div className="mt-4 text-sm text-right text-muted-foreground">
          Add-ons subtotal:{" "}
          <strong className="text-foreground">
            {formatGYD(
              addOns
                .filter((a) => selectedAddOns.includes(a.slug))
                .reduce((s, a) => s + a.priceGYD, 0)
            )}
          </strong>
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} canNext={true} />
    </div>
  );
}

// ─── Step 4: Guest Details ────────────────────────────────────────────────────

function StepDetails({
  name,
  setName,
  contact,
  setContact,
  notes,
  setNotes,
  onBack,
  onNext,
}: {
  name: string;
  setName: (v: string) => void;
  contact: string;
  setContact: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const canNext = name.trim().length > 1 && contact.trim().length > 4;

  return (
    <div className="p-6 md:p-8">
      <StepHeader title="Your Details" subtitle="So we know how to reach you on WhatsApp." />
      <div className="mt-5 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-1.5">Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Maria Gonzalez"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none focus:border-[#2D5016] transition-colors"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Phone or Email *
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="WhatsApp number or email"
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none focus:border-[#2D5016] transition-colors"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1.5">
            Special Requests <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Dietary needs, accessibility requirements, anything else…"
            rows={3}
            className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm outline-none focus:border-[#2D5016] transition-colors resize-none"
          />
        </div>
      </div>
      <StepNav onBack={onBack} onNext={onNext} canNext={canNext} nextLabel="Review Booking" />
    </div>
  );
}

// ─── Step 5: Confirm ──────────────────────────────────────────────────────────

type SubmitState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; bookingId: number }
  | { status: "error"; message: string };

function StepConfirm({
  cabin,
  range,
  nights,
  guests,
  selectedAddOns,
  name,
  contact,
  notes,
  total,
  whatsappLink,
  submitState,
  onSubmit,
  onBack,
  onEditStep,
}: {
  cabin: Cabin | null;
  range: DateRange | undefined;
  nights: number;
  guests: number;
  selectedAddOns: string[];
  name: string;
  contact: string;
  notes: string;
  total: number;
  whatsappLink: string;
  submitState: SubmitState;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (s: Step) => void;
}) {
  const chosenAddOns = addOns.filter((a) => selectedAddOns.includes(a.slug));

  // ── Success state ──────────────────────────────────────────────────────────
  if (submitState.status === "success") {
    return (
      <div className="p-6 md:p-8 text-center">
        <div className="text-5xl mb-4">🌿</div>
        <h2 className="text-2xl font-black mb-2">Booking Received!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Your request #{submitState.bookingId} has been sent to Stephen.
        </p>
        <p className="text-sm text-muted-foreground mb-7">
          He'll confirm via WhatsApp and arrange payment details.
        </p>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#25D366" }}
        >
          <WhatsAppSVG />
          Follow up on WhatsApp
        </a>
        <div className="mt-5">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ── Normal review state ────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8">
      <StepHeader
        title="Review & Confirm"
        subtitle="Everything look right? We'll notify Stephen right away."
      />

      <div className="mt-5 space-y-3">
        <SummaryRow label="Cabin"   value={cabin?.name ?? "—"}                                     onEdit={() => onEditStep(1)} />
        <SummaryRow
          label="Dates"
          value={range?.from && range?.to
            ? `${format(range.from, "d MMM")} – ${format(range.to, "d MMM yyyy")} (${nights} night${nights !== 1 ? "s" : ""})`
            : "—"}
          onEdit={() => onEditStep(2)}
        />
        <SummaryRow label="Guests"  value={`${guests} guest${guests !== 1 ? "s" : ""}`}           onEdit={() => onEditStep(3)} />
        <SummaryRow label="Add-ons" value={chosenAddOns.length > 0 ? chosenAddOns.map((a) => a.name).join(", ") : "None"} onEdit={() => onEditStep(3)} />
        <SummaryRow label="Name"    value={name}                                                   onEdit={() => onEditStep(4)} />
        <SummaryRow label="Contact" value={contact}                                                onEdit={() => onEditStep(4)} />
        {notes.trim() && <SummaryRow label="Notes" value={notes}                                   onEdit={() => onEditStep(4)} />}
      </div>

      {/* Total */}
      <div
        className="mt-5 rounded-xl p-4 flex items-center justify-between"
        style={{ backgroundColor: "#FAF6F0", border: "1px solid #C4941A44" }}
      >
        <div>
          <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Estimated Total</p>
          <p className="text-2xl font-black mt-0.5" style={{ color: "#2D5016" }}>{formatGYD(total)}</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-[140px] text-right leading-relaxed">
          Payment by bank transfer or cheque after confirmation.
        </p>
      </div>

      {/* Error */}
      {submitState.status === "error" && (
        <div className="mt-4 rounded-xl px-4 py-3 bg-red-50 border border-red-200 text-sm text-red-700">
          {submitState.message}. You can still{" "}
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            send via WhatsApp
          </a>{" "}
          instead.
        </div>
      )}

      {/* Primary CTA — submit to API */}
      <button
        onClick={onSubmit}
        disabled={submitState.status === "loading"}
        className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#2D5016" }}
      >
        {submitState.status === "loading" ? "Sending…" : "Send Booking Request"}
      </button>

      {/* Fallback WhatsApp */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Or{" "}
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
           className="underline font-semibold" style={{ color: "#25D366" }}>
          send directly via WhatsApp
        </a>
      </p>

      <div className="mt-4 text-center">
        <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground underline">
          ← Edit details
        </button>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-black">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function StepNav({
  onBack,
  onNext,
  canNext,
  nextLabel = "Continue",
}: {
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="mt-7 flex gap-3">
      <button
        onClick={onBack}
        className="flex-1 rounded-xl border-2 border-border py-2.5 text-sm font-semibold hover:border-foreground transition-colors"
      >
        Back
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className="flex-[2] rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
        style={{ backgroundColor: "#2D5016" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wide w-24 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm flex-1 leading-relaxed">{value}</span>
      <button
        onClick={onEdit}
        className="text-xs font-semibold shrink-0 hover:underline"
        style={{ color: "#2D5016" }}
      >
        Edit
      </button>
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
