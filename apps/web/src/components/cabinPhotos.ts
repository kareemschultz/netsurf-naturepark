/**
 * Real property photos for each cabin slug.
 * primary: shown as hero and card thumbnail
 * gallery: shown in the "A Feel for This Stay" section on detail page
 */
export const cabinPhotos: Record<
  string,
  { primary: string; gallery: string[] }
> = {
  "camping-site": {
    primary: "/images/social/facebook-creek-deck.jpg",
    gallery: ["/images/social/facebook-creek-deck.jpg"],
  },
  "couples-cabin": {
    primary: "/images/cabins/couples-night.jpg",
    gallery: [
      "/images/cabins/couples-night.jpg",
      "/images/cabins/couples-interior.jpg",
    ],
  },
  "couples-cabin-1": {
    primary: "/images/cabins/couples-interior.jpg",
    gallery: [
      "/images/cabins/couples-interior.jpg",
      "/images/cabins/couples-night.jpg",
    ],
  },
  "family-cabin": {
    primary: "/images/cabins/family-exterior.jpg",
    gallery: ["/images/cabins/family-exterior.jpg"],
  },
  "family-cabin-full": {
    primary: "/images/cabins/family-exterior.jpg",
    gallery: ["/images/cabins/family-exterior.jpg"],
  },
  "hansel-and-gretel-cabin": {
    primary: "/images/cabins/ranch-exterior.jpg",
    gallery: ["/images/cabins/ranch-exterior.jpg"],
  },
  "ranch-building": {
    primary: "/images/cabins/ranch-exterior.jpg",
    gallery: ["/images/cabins/ranch-exterior.jpg"],
  },
}

export function getCabinPrimaryPhoto(slug: string): string | null {
  return cabinPhotos[slug]?.primary ?? null
}

export function getCabinGalleryPhotos(slug: string): string[] {
  return cabinPhotos[slug]?.gallery ?? []
}
