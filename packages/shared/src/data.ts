export type CabinCategory = "cabin" | "camping"

export interface Cabin {
  slug: string
  name: string
  priceGYD: number
  maxGuests: number
  category: CabinCategory
  tagline: string
  description: string
  features: string[]
  whatsappText: string
}

export type AddOnCategory = "access" | "meal" | "activity" | "transport"

export interface AddOn {
  slug: string
  name: string
  priceGYD: number
  category: AddOnCategory
  description: string
  icon: string
}

export const cabins: Cabin[] = [
  {
    slug: "camping-site",
    name: "Camping Site",
    priceGYD: 5000,
    maxGuests: 4,
    category: "camping",
    tagline: "Sleep under a canopy of stars",
    description:
      "Fall asleep to the sounds of the blackwater creek and wake up to the chorus of tropical birds. Our camping sites are tucked within the rainforest, offering a true back-to-nature experience with shared facilities and fire pits.",
    features: [
      "Per tent pricing",
      "Shared bathroom facilities",
      "Fire pit area",
      "Hammock hooks",
      "Creek access",
      "100% solar-powered site lighting",
    ],
    whatsappText:
      "Hi! I'd like to book a Camping Site at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "couples-cabin",
    name: "Couples Cabin",
    priceGYD: 25000,
    maxGuests: 3,
    category: "cabin",
    tagline: "Your private rainforest retreat",
    description:
      "A cozy, solar-powered cabin perfectly suited for couples seeking peace in the rainforest. Step outside to the sound of the creek and the rustle of the canopy above.",
    features: [
      "Private en-suite bathroom",
      "Solar power",
      "Nature views from every window",
      "Creek access",
      "Ideal for couples",
    ],
    whatsappText:
      "Hi! I'd like to book the Couples Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "couples-cabin-1",
    name: "Couples Cabin No. 1",
    priceGYD: 29800,
    maxGuests: 3,
    category: "cabin",
    tagline: "Premium couples retreat in the rainforest",
    description:
      "Our premium couples cabin with enhanced finishes and a more secluded position on the property. Ideal for a special occasion or honeymoon-style getaway.",
    features: [
      "Private en-suite bathroom",
      "Solar power",
      "Premium interior finishes",
      "Secluded creek-side position",
      "Nature views",
      "Pool access",
    ],
    whatsappText:
      "Hi! I'd like to book Couples Cabin No. 1 at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "family-cabin",
    name: "Family Cabin",
    priceGYD: 39800,
    maxGuests: 9,
    category: "cabin",
    tagline: "Space and comfort in the wild",
    description:
      "The perfect family or small-group getaway. The Family Cabin offers more space to spread out while staying immersed in the sights and sounds of the Guyanese rainforest.",
    features: [
      "Private en-suite bathroom",
      "Solar power",
      "Kitchenette",
      "Sleeping for up to 6 guests",
      "Creek access",
    ],
    whatsappText:
      "Hi! I'd like to book the Family Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "family-cabin-full",
    name: "Family Cabin (Full)",
    priceGYD: 60000,
    maxGuests: 12,
    category: "cabin",
    tagline: "The whole cabin, all to yourselves",
    description:
      "Book the full Family Cabin complex for larger groups — ideal for family reunions, group retreats, or an extended weekend deep in the Guyanese rainforest.",
    features: [
      "Full exclusive use",
      "Private en-suite bathroom",
      "Solar power",
      "Kitchenette",
      "Sleeping for up to 10 guests",
      "Creek access",
    ],
    whatsappText:
      "Hi! I'd like to book the Family Cabin (Full) at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "hansel-and-gretel-cabin",
    name: "Hansel & Gretel Cabin",
    priceGYD: 55000,
    maxGuests: 10,
    category: "cabin",
    tagline: "A fairytale deep in the rainforest",
    description:
      "Our signature cabin. The Hansel & Gretel is a storybook retreat with the most space and premium amenities on the property — ideal for larger families or groups who want to do it in style.",
    features: [
      "Full private kitchen",
      "BBQ grill and coal pot included",
      "Multiple bedrooms",
      "Solar power",
      "Outdoor deck with rainforest views",
      "Creek access",
      "Sleeps up to 10 guests",
    ],
    whatsappText:
      "Hi! I'd like to book the Hansel & Gretel Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "ranch-building",
    name: "Ranch Building",
    priceGYD: 60000,
    maxGuests: 18,
    category: "cabin",
    tagline: "Large-group venue in the rainforest",
    description:
      "Our largest accommodation — perfect for corporate retreats, large family gatherings, or group events. The Ranch Building offers generous shared space with full solar power and direct creek access.",
    features: [
      "Capacity for up to 18 guests",
      "Individual pool access",
      "Large shared common areas",
      "Fully equipped kitchen",
      "Solar power",
      "Creek access",
      "Ideal for group events",
    ],
    whatsappText:
      "Hi! I'd like to enquire about the Ranch Building at Netsurf Nature Park. Could you help me with availability?",
  },
]

export const addOns: AddOn[] = [
  {
    slug: "day-pass",
    name: "Day Pass",
    priceGYD: 2000,
    category: "access",
    description:
      "Access to the park for the day. Adult $2,000 · Teen $1,500 · Child $1,000 · Under 5 free.",
    icon: "sun",
  },
  {
    slug: "breakfast",
    name: "Breakfast",
    priceGYD: 2000,
    category: "meal",
    description:
      "A fresh local breakfast prepared for you each morning. Per person.",
    icon: "egg",
  },
  {
    slug: "dinner",
    name: "Dinner",
    priceGYD: 3500,
    category: "meal",
    description:
      "A hearty Guyanese dinner made with locally sourced ingredients. Per person.",
    icon: "utensils",
  },
  {
    slug: "bbq-package",
    name: "BBQ Package",
    priceGYD: 4500,
    category: "meal",
    description:
      "A full BBQ spread for your group — perfect for evenings by the fire.",
    icon: "flame",
  },
  {
    slug: "coal-pot",
    name: "Coal Pot Rental",
    priceGYD: 3500,
    category: "meal",
    description:
      "Rent a traditional coal pot for your stay — great for slow-cooking a Guyanese meal at the campfire.",
    icon: "flame",
  },
  {
    slug: "nature-walk",
    name: "Guided Nature Walk",
    priceGYD: 3000,
    category: "activity",
    description:
      "Explore the rainforest with a knowledgeable local guide. Spot wildlife, medicinal plants, and hidden trails.",
    icon: "footprints",
  },
  {
    slug: "kayak-rental",
    name: "Kayak Rental (Half Day)",
    priceGYD: 4000,
    category: "activity",
    description:
      "Paddle the blackwater creek at your own pace. Equipment and safety gear included.",
    icon: "waves",
  },
  {
    slug: "transport",
    name: "Transport from Georgetown",
    priceGYD: 5000,
    category: "transport",
    description:
      "Door-to-door pickup and drop-off from Georgetown along the Soesdyke-Linden Highway.",
    icon: "car",
  },
]

export const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "transfer", label: "Bank Transfer" },
] as const

export type PaymentMethod = (typeof paymentMethods)[number]["value"]

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

export const testimonials = [
  {
    id: 1,
    name: "Priya R.",
    location: "Trinidad & Tobago",
    text: "Waking up to the sound of the creek with zero electricity noise — just birdsong — was something I didn't know I needed. Netsurf Nature Park restored me completely.",
    rating: 5,
  },
  {
    id: 2,
    name: "David & Sarah K.",
    location: "United Kingdom",
    text: "We booked the Hansel & Gretel cabin for our anniversary. The whole experience felt like a secret the rest of the world hasn't discovered yet. Absolutely magical.",
    rating: 5,
  },
  {
    id: 3,
    name: "Marcus T.",
    location: "Barbados",
    text: "The guided nature walk was a highlight. Our guide knew every plant and bird by name. The kayaking on the blackwater creek at sunset is something I'll never forget.",
    rating: 5,
  },
]

export type GalleryCategory =
  | "all"
  | "cabins"
  | "creek-nature"
  | "experiences"
  | "park-life"

export interface GalleryImage {
  src: string
  alt: string
  category: Exclude<GalleryCategory, "all">
}

export const galleryImages: GalleryImage[] = [
  {
    src: "/images/social/facebook-creek-deck.jpg",
    alt: "Blackwater creek deck at Netsurf Nature Park",
    category: "creek-nature",
  },
  {
    src: "/images/cabins/couples-night.jpg",
    alt: "Couples Cabin at night — solar-lit exterior at Netsurf Nature Park",
    category: "cabins",
  },
  {
    src: "/images/cabins/family-exterior.jpg",
    alt: "Family Cabin exterior surrounded by rainforest",
    category: "cabins",
  },
  {
    src: "/images/cabins/couples-interior.jpg",
    alt: "Inside the Couples Cabin at Netsurf Nature Park",
    category: "cabins",
  },
  {
    src: "/images/cabins/ranch-exterior.jpg",
    alt: "The Ranch Building — large group cabin at Netsurf Nature Park",
    category: "cabins",
  },
]

export const features = [
  {
    title: "100% Solar Powered",
    description:
      "Every light, fan, and outlet on the property runs on clean solar energy. No generators. No noise.",
    icon: "solar",
  },
  {
    title: "Blackwater Creek",
    description:
      "Swim, kayak, or simply sit by Guyana's unique dark-water creek — tannin-stained, crystal clear, and peaceful.",
    icon: "water",
  },
  {
    title: "DIY Cooking",
    description:
      "Bring your own ingredients and use our outdoor kitchen — or let us cook for you with our meal packages.",
    icon: "fire",
  },
  {
    title: "True Wilderness",
    description:
      "No roads cutting through the property. Just rainforest, wildlife, and the sounds of nature.",
    icon: "tree",
  },
  {
    title: "Guided Experiences",
    description:
      "Knowledgeable local guides lead nature walks, birdwatching tours, and creek adventures.",
    icon: "compass",
  },
  {
    title: "Close to Georgetown",
    description:
      "Just off the Soesdyke-Linden Highway — easily reachable from the capital, yet worlds away.",
    icon: "map",
  },
]


export interface FaqItem {
  question: string
  answer: string
  category: "booking" | "stay" | "activities" | "getting-there" | "policies"
}

export const faqs: FaqItem[] = [
  {
    category: "booking",
    question: "How do I make a booking?",
    answer:
      "Contact us via WhatsApp at +592 611-9443 or use our online booking form. We'll confirm availability and send you details within 24 hours.",
  },
  {
    category: "booking",
    question: "What is the cancellation policy?",
    answer:
      "Cancellations made 7 or more days before check-in receive a full refund. Cancellations within 7 days are non-refundable but may be rescheduled subject to availability.",
  },
  {
    category: "stay",
    question: "Is Netsurf Nature Park 100% solar powered?",
    answer:
      "Yes! All our facilities run entirely on solar power provided by Netsurf Power, ensuring a sustainable and eco-friendly experience without compromising comfort.",
  },
  {
    category: "stay",
    question: "What is included in my stay?",
    answer:
      "Your stay includes accommodation, access to the creek and nature trails, and basic kitchen facilities. Meals, guided activities, and transport are available as add-ons.",
  },
  {
    category: "stay",
    question: "Is there Wi-Fi available?",
    answer:
      "We intentionally provide limited connectivity to encourage a full nature experience. Basic Wi-Fi is available in the common areas for essential use.",
  },
  {
    category: "activities",
    question: "What activities are available?",
    answer:
      "We offer guided nature walks, kayaking on Soesdyke Creek, BBQ packages, birdwatching, and swimming. Day passes are available for visitors not staying overnight.",
  },
  {
    category: "activities",
    question: "Can I bring my own kayak or equipment?",
    answer:
      "Absolutely! You're welcome to bring your own gear. We also have kayaks available for rental if you'd prefer not to transport your own.",
  },
  {
    category: "getting-there",
    question: "How do I get to Netsurf Nature Park?",
    answer:
      "We're located on the Soesdyke-Linden Highway, about 45 minutes from Georgetown. We offer transport from Georgetown for GYD $5,000. GPS coordinates: 6.0870307, -58.2677041.",
  },
  {
    category: "getting-there",
    question: "Is there parking available?",
    answer:
      "Yes, there is ample secure parking on site for guests who drive themselves.",
  },
  {
    category: "policies",
    question: "Are pets allowed?",
    answer:
      "We love animals but to protect the local wildlife, pets are not permitted at Netsurf Nature Park.",
  },
  {
    category: "policies",
    question: "Is Netsurf Nature Park suitable for children?",
    answer:
      "Absolutely! We're a family-friendly destination. Children must be supervised near the creek at all times. Please note that some activities have age/weight restrictions.",
  },
  {
    category: "policies",
    question: "What payment methods do you accept?",
    answer:
      "We accept cash (GYD), bank transfers, and card payments. Full payment is required at check-in. Deposits may be required for bookings during peak periods.",
  },
]

export const dayPassPriceGYD =
  addOns.find((item) => item.slug === "day-pass")?.priceGYD ?? 5000

export const locationDetails = {
  lat: 6.0870307,
  lng: -58.2677041,
  label: "Soesdyke-Linden Highway, Guyana",
  gpsText: "6.0870307, -58.2677041",
  mapEmbedUrl:
    "https://maps.google.com/maps?q=6.0870307,-58.2677041&z=14&output=embed",
} as const

export const contacts = {
  phone1: "+592 611-9443",
  phone2: "+592 621-8271",
  whatsappNumber: "5926119443",
  whatsappLink: "https://wa.me/5926119443",
  facebook: "https://www.facebook.com/netsurfnaturepark",
  instagram: "https://www.instagram.com/netsurfnaturepark",
  locationName: locationDetails.label,
  gps: { lat: locationDetails.lat, lng: locationDetails.lng },
  mapsLink: `https://maps.google.com/?q=${locationDetails.lat},${locationDetails.lng}`,
}

const guyanaNumberFormatter = new Intl.NumberFormat("en-GY", {
  maximumFractionDigits: 0,
})

const bookingDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function formatGYD(amount: number): string {
  return `GYD $${guyanaNumberFormatter.format(amount)}`
}

export function whatsappBookingLink(cabin: Cabin): string {
  return buildWhatsAppTextLink(cabin.whatsappText)
}

export type StayType = "overnight" | "day_use"

export interface BookingRequest {
  cabin: Cabin
  stayType: StayType
  checkIn: Date
  checkOut: Date
  guests: number
  addOnSlugs: string[]
  name: string
  contact: string
  notes: string
}

export function buildWhatsAppBookingMessage(req: BookingRequest): string {
  const stayType = req.stayType ?? "overnight"
  const computedNights = Math.round(
    (req.checkOut.getTime() - req.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )
  const nights = stayType === "day_use" ? 1 : Math.max(1, computedNights)
  const fmt = (d: Date) => bookingDateFormatter.format(d)

  const selectedAddOns = addOns.filter((a) => req.addOnSlugs.includes(a.slug))
  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.priceGYD, 0)
  const total = req.cabin.priceGYD * nights + addOnTotal

  const lines = [
    `Hi! I'd like to book at Netsurf Nature Park.`,
    ``,
    `*Accommodation:* ${req.cabin.name}`,
    `*Stay Type:* ${stayType === "day_use" ? "Day visit only" : "Overnight stay"}`,
    stayType === "day_use"
      ? `*Visit Date:* ${fmt(req.checkIn)}`
      : `*Check-in:* ${fmt(req.checkIn)}`,
    ...(stayType === "day_use"
      ? []
      : [`*Check-out:* ${fmt(req.checkOut)} (${nights} night${nights !== 1 ? "s" : ""})`]),
    `*Guests:* ${req.guests}`,
  ]

  if (selectedAddOns.length > 0) {
    lines.push(`*Add-ons:* ${selectedAddOns.map((a) => a.name).join(", ")}`)
  }

  lines.push(``, `*Name:* ${req.name}`, `*Contact:* ${req.contact}`)

  if (req.notes.trim()) {
    lines.push(`*Notes:* ${req.notes}`)
  }

  lines.push(``, `*Estimated Total:* ${formatGYD(total)}`)
  lines.push(``, `Please confirm availability. Thank you!`)

  return lines.join("\n")
}

export function buildWhatsAppBookingLink(req: BookingRequest): string {
  return buildWhatsAppTextLink(buildWhatsAppBookingMessage(req))
}

export function buildWhatsAppTextLink(message: string): string {
  return `https://wa.me/${contacts.whatsappNumber}?text=${encodeURIComponent(message)}`
}
