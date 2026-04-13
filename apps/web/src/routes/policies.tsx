import type { ReactNode } from "react"

import { createFileRoute } from "@tanstack/react-router"
import { contacts } from "@workspace/shared"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { AnimatedPageHero } from "../components/AnimatedHeroBg"
import { BlurFade } from "../components/BlurFade"

export const Route = createFileRoute("/policies")({
  component: PoliciesPage,
})

function PoliciesPage() {
  return (
    <>
      <AnimatedPageHero
        eyebrow="Before You Book"
        title="Policies & Terms"
        subtitle="Please read these before making a reservation."
      />
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <BlurFade inView>
          <Tabs defaultValue="policies" aria-label="Policies and terms tabs">
            <TabsList className="mb-6 grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
              <TabsTrigger value="policies" className="w-full">
                Booking Policies
              </TabsTrigger>
              <TabsTrigger value="terms" className="w-full">
                Terms & Conditions
              </TabsTrigger>
              <TabsTrigger value="about" className="w-full">
                About the Park
              </TabsTrigger>
            </TabsList>

            <TabsContent value="policies" className="space-y-6">
              <PolicySection title="Reservations">
                <p>
                  All bookings are confirmed via WhatsApp. Once you message us
                  with your preferred dates and cabin type, we&apos;ll check
                  availability and confirm within a few hours.
                </p>
                <p>
                  A deposit of 50% of the total stay is required to secure your
                  booking. The remaining balance is due on arrival. All
                  payments are via bank transfer (Guyana-based accounts only).
                </p>
              </PolicySection>

              <PolicySection title="Check-in & Check-out">
                <p>
                  <strong>Check-in:</strong> From 2:00 PM on your arrival date.
                </p>
                <p>
                  <strong>Check-out:</strong> By 11:00 AM on your departure
                  date.
                </p>
                <p>
                  Early check-in and late check-out may be available on request
                  — message us on WhatsApp to arrange.
                </p>
              </PolicySection>

              <PolicySection title="Cancellations">
                <p>
                  <strong>7+ days before arrival:</strong> Full deposit refund.
                </p>
                <p>
                  <strong>3–6 days before arrival:</strong> 50% of deposit
                  refunded.
                </p>
                <p>
                  <strong>Less than 3 days before arrival:</strong> No refund on
                  deposit.
                </p>
                <p>
                  In the event that we need to cancel your booking (e.g.,
                  extreme weather, unforeseen circumstances), you will receive a
                  full refund or the option to reschedule at no additional
                  cost.
                </p>
              </PolicySection>

              <PolicySection title="Rules & Conduct">
                <ul className="list-inside list-disc space-y-1.5">
                  <li>
                    Respect the natural environment — no littering, no picking
                    plants.
                  </li>
                  <li>Keep noise to a minimum after 10:00 PM.</li>
                  <li>No outside alcohol unless arranged in advance.</li>
                  <li>
                    Pets welcome with prior notice — please keep them on a
                    leash near the creek.
                  </li>
                  <li>Campfires are permitted in designated fire pit areas only.</li>
                  <li>Swimming in the creek is at your own risk.</li>
                </ul>
              </PolicySection>
            </TabsContent>

            <TabsContent value="terms" className="space-y-6">
              <PolicySection title="Agreement">
                <p>
                  By making a booking at Netsurf Nature Park, you agree to
                  these terms and conditions in full. Netsurf Nature Park
                  reserves the right to refuse entry or ask guests to leave if
                  these terms are violated.
                </p>
              </PolicySection>

              <PolicySection title="Liability">
                <p>
                  Netsurf Nature Park is a natural environment. Guests
                  acknowledge that activities including but not limited to
                  swimming, hiking, kayaking, and campfires carry inherent
                  risks. The park and its operators accept no liability for
                  personal injury, loss, or damage to property arising from
                  participation in these activities.
                </p>
                <p>
                  We strongly recommend that all guests carry personal travel
                  and health insurance.
                </p>
              </PolicySection>

              <PolicySection title="Privacy">
                <p>
                  Personal information (name, phone number, email) collected
                  during booking is used solely for the purpose of managing your
                  reservation. We do not share your data with third parties.
                </p>
              </PolicySection>

              <PolicySection title="Changes to Terms">
                <p>
                  Netsurf Nature Park reserves the right to update these terms
                  at any time. The current version will always be available on
                  this page.
                </p>
              </PolicySection>
            </TabsContent>

            <TabsContent value="about" className="space-y-6">
              <PolicySection title="The Environment">
                <p>
                  Netsurf Nature Park operates within a pristine rainforest
                  environment on the Soesdyke-Linden Highway, Guyana. The
                  blackwater creek and surrounding flora and fauna are protected
                  as part of our commitment to conservation.
                </p>
                <p>
                  We ask all guests to treat the natural environment with the
                  utmost care and respect. Leave no trace. Take only
                  photographs.
                </p>
              </PolicySection>

              <PolicySection title="Solar Energy">
                <p>
                  The entire property runs on 100% solar energy — a project
                  developed and maintained by Netsurf Power, our sister company
                  specialising in renewable energy solutions in Guyana. There
                  are no diesel generators on site.
                </p>
              </PolicySection>

              <PolicySection title="Contact">
                <p>
                  For any questions about our policies, please contact us via
                  WhatsApp at {contacts.phone1} or {contacts.phone2}.
                </p>
              </PolicySection>
            </TabsContent>
          </Tabs>
          </BlurFade>
        </div>
      </div>
    </>
  )
}

function PolicySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6">
      <h2 className="mb-3 text-base font-bold" style={{ color: "#2D5016" }}>
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
