export type CabinCategory = "cabin" | "camping";

export interface Cabin {
  slug: string;
  name: string;
  priceGYD: number;
  maxGuests: number;
  category: CabinCategory;
  tagline: string;
  description: string;
  features: string[];
  images: string[];
  whatsappText: string;
}

export type AddOnCategory = "access" | "meal" | "activity" | "transport";

export interface AddOn {
  slug: string;
  name: string;
  priceGYD: number;
  category: AddOnCategory;
  description: string;
  icon: string;
}

export const cabins: Cabin[] = [
  {
    slug: "camping-site",
    name: "Camping Site",
    priceGYD: 8000,
    maxGuests: 4,
    category: "camping",
    tagline: "Sleep under a canopy of stars",
    description:
      "Fall asleep to the sounds of the blackwater creek and wake up to the chorus of tropical birds. Our camping sites are tucked within the rainforest, offering a true back-to-nature experience with shared facilities and fire pits.",
    features: [
      "Shared bathroom facilities",
      "Fire pit area",
      "Hammock hooks",
      "Creek access",
      "100% solar-powered site lighting",
    ],
    images: ["/images/camping-1.jpg", "/images/camping-2.jpg"],
    whatsappText:
      "Hi! I'd like to book the Camping Site at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "nature-cabin",
    name: "Nature Cabin",
    priceGYD: 15000,
    maxGuests: 2,
    category: "cabin",
    tagline: "Your private rainforest retreat",
    description:
      "A cozy, solar-powered cabin perfectly suited for couples or solo travellers seeking peace in the rainforest. Step outside to the sound of the creek and the rustle of the canopy above.",
    features: [
      "Private en-suite bathroom",
      "Solar power",
      "Nature views from every window",
      "Creek access",
      "Ideal for couples",
    ],
    images: ["/images/nature-cabin-1.jpg", "/images/nature-cabin-2.jpg"],
    whatsappText:
      "Hi! I'd like to book the Nature Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "medium-cabin",
    name: "Medium Cabin",
    priceGYD: 18000,
    maxGuests: 4,
    category: "cabin",
    tagline: "Space and comfort in the wild",
    description:
      "The perfect family or small-group getaway. The Medium Cabin offers more space to spread out while staying immersed in the sights and sounds of the Guyanese rainforest.",
    features: [
      "Private en-suite bathroom",
      "Solar power",
      "Kitchenette",
      "Sleeping for up to 4 guests",
      "Creek access",
    ],
    images: ["/images/medium-cabin-1.jpg", "/images/medium-cabin-2.jpg"],
    whatsappText:
      "Hi! I'd like to book the Medium Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
  {
    slug: "hansel-and-gretel-cabin",
    name: "Hansel & Gretel Cabin",
    priceGYD: 30000,
    maxGuests: 6,
    category: "cabin",
    tagline: "A fairytale deep in the rainforest",
    description:
      "Our signature cabin. The Hansel & Gretel is a storybook retreat with the most space and premium amenities on the property — ideal for larger families or groups who want to do it in style.",
    features: [
      "Full private kitchen",
      "Multiple bedrooms",
      "Solar power",
      "Outdoor deck with rainforest views",
      "Creek access",
      "Sleeps up to 6 guests",
    ],
    images: [
      "/images/hansel-gretel-1.jpg",
      "/images/hansel-gretel-2.jpg",
      "/images/hansel-gretel-3.jpg",
    ],
    whatsappText:
      "Hi! I'd like to book the Hansel & Gretel Cabin at Netsurf Nature Park. Could you help me with availability?",
  },
];

export const addOns: AddOn[] = [
  {
    slug: "day-pass",
    name: "Day Pass",
    priceGYD: 5000,
    category: "access",
    description: "Spend the day exploring the park, swimming in the creek, and enjoying the rainforest.",
    icon: "sun",
  },
  {
    slug: "breakfast",
    name: "Breakfast",
    priceGYD: 2000,
    category: "meal",
    description: "A fresh local breakfast prepared for you each morning. Per person.",
    icon: "egg",
  },
  {
    slug: "dinner",
    name: "Dinner",
    priceGYD: 3500,
    category: "meal",
    description: "A hearty Guyanese dinner made with locally sourced ingredients. Per person.",
    icon: "utensils",
  },
  {
    slug: "bbq-package",
    name: "BBQ Package",
    priceGYD: 8000,
    category: "meal",
    description: "A full BBQ spread for your group — perfect for evenings by the fire.",
    icon: "flame",
  },
  {
    slug: "nature-walk",
    name: "Guided Nature Walk",
    priceGYD: 3000,
    category: "activity",
    description: "Explore the rainforest with a knowledgeable local guide. Spot wildlife, medicinal plants, and hidden trails.",
    icon: "footprints",
  },
  {
    slug: "kayak-rental",
    name: "Kayak Rental (Half Day)",
    priceGYD: 4000,
    category: "activity",
    description: "Paddle the blackwater creek at your own pace. Equipment and safety gear included.",
    icon: "waves",
  },
  {
    slug: "transport",
    name: "Transport from Georgetown",
    priceGYD: 5000,
    category: "transport",
    description: "Door-to-door pickup and drop-off from Georgetown along the Soesdyke-Linden Highway.",
    icon: "car",
  },
];

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
];

export const galleryImages = [
  { src: "/images/gallery-1.jpg", alt: "Blackwater creek at Netsurf Nature Park" },
  { src: "/images/gallery-2.jpg", alt: "Rainforest canopy view from the cabins" },
  { src: "/images/gallery-3.jpg", alt: "Nature cabin surrounded by tropical foliage" },
  { src: "/images/gallery-4.jpg", alt: "Sunset over the Soesdyke-Linden Highway wetlands" },
  { src: "/images/gallery-5.jpg", alt: "Kayaking on the blackwater creek" },
  { src: "/images/gallery-6.jpg", alt: "Campfire under the rainforest canopy" },
  { src: "/images/gallery-7.jpg", alt: "Tropical birds spotted on a guided nature walk" },
  { src: "/images/gallery-8.jpg", alt: "Morning mist rising from the creek" },
  { src: "/images/gallery-9.jpg", alt: "Hansel and Gretel cabin outdoor deck" },
  { src: "/images/gallery-10.jpg", alt: "Solar panels powering the eco-retreat" },
  { src: "/images/gallery-11.jpg", alt: "BBQ evening at the campfire area" },
  { src: "/images/gallery-12.jpg", alt: "Hammocking by the creek at Netsurf" },
];

export const features = [
  {
    title: "100% Solar Powered",
    description: "Every light, fan, and outlet on the property runs on clean solar energy. No generators. No noise.",
    icon: "solar",
  },
  {
    title: "Blackwater Creek",
    description: "Swim, kayak, or simply sit by Guyana's unique dark-water creek — tannin-stained, crystal clear, and peaceful.",
    icon: "water",
  },
  {
    title: "DIY Cooking",
    description: "Bring your own ingredients and use our outdoor kitchen — or let us cook for you with our meal packages.",
    icon: "fire",
  },
  {
    title: "True Wilderness",
    description: "No roads cutting through the property. Just rainforest, wildlife, and the sounds of nature.",
    icon: "tree",
  },
  {
    title: "Guided Experiences",
    description: "Knowledgeable local guides lead nature walks, birdwatching tours, and creek adventures.",
    icon: "compass",
  },
  {
    title: "Close to Georgetown",
    description: "Just off the Soesdyke-Linden Highway — easily reachable from the capital, yet worlds away.",
    icon: "map",
  },
];

export const contacts = {
  phone1: "+592 611-9443",
  phone2: "+592 621-8271",
  whatsappNumber: "5926119443",
  whatsappLink: "https://wa.me/5926119443",
  facebook: "https://www.facebook.com/netsurfnaturepark",
  instagram: "https://www.instagram.com/netsurfnaturepark",
  locationName: "Soesdyke-Linden Highway, Guyana",
  gps: { lat: 6.0870307, lng: -58.2677041 },
  mapsLink: "https://maps.google.com/?q=6.0870307,-58.2677041",
};

export function formatGYD(amount: number): string {
  return `GYD $${amount.toLocaleString()}`;
}

export function whatsappBookingLink(cabin: Cabin): string {
  return `https://wa.me/${contacts.whatsappNumber}?text=${encodeURIComponent(cabin.whatsappText)}`;
}

export interface BookingRequest {
  cabin: Cabin;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  addOnSlugs: string[];
  name: string;
  contact: string;
  notes: string;
}

export function buildWhatsAppBookingMessage(req: BookingRequest): string {
  const nights = Math.round(
    (req.checkOut.getTime() - req.checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const selectedAddOns = addOns.filter((a) => req.addOnSlugs.includes(a.slug));
  const addOnTotal = selectedAddOns.reduce((s, a) => s + a.priceGYD, 0);
  const total = req.cabin.priceGYD * nights + addOnTotal;

  const lines = [
    `Hi! I'd like to book at Netsurf Nature Park.`,
    ``,
    `*Accommodation:* ${req.cabin.name}`,
    `*Check-in:* ${fmt(req.checkIn)}`,
    `*Check-out:* ${fmt(req.checkOut)} (${nights} night${nights !== 1 ? "s" : ""})`,
    `*Guests:* ${req.guests}`,
  ];

  if (selectedAddOns.length > 0) {
    lines.push(`*Add-ons:* ${selectedAddOns.map((a) => a.name).join(", ")}`);
  }

  lines.push(``, `*Name:* ${req.name}`, `*Contact:* ${req.contact}`);

  if (req.notes.trim()) {
    lines.push(`*Notes:* ${req.notes}`);
  }

  lines.push(``, `*Estimated Total:* GYD $${total.toLocaleString()}`);
  lines.push(``, `Please confirm availability. Thank you!`);

  return lines.join("\n");
}

export function buildWhatsAppBookingLink(req: BookingRequest): string {
  return `https://wa.me/${contacts.whatsappNumber}?text=${encodeURIComponent(
    buildWhatsAppBookingMessage(req)
  )}`;
}
