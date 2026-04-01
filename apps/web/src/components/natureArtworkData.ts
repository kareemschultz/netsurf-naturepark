import type { Cabin } from "@workspace/shared"

import type { NatureArtworkVariant } from "./NatureArtwork"

export function getCabinArtworkVariant(cabin: Cabin): NatureArtworkVariant {
  switch (cabin.slug) {
    case "camping-site":
      return "camp"
    case "couples-cabin":
    case "couples-cabin-1":
      return "hideaway"
    case "family-cabin":
    case "family-cabin-full":
      return "family"
    case "hansel-and-gretel-cabin":
      return "signature"
    default:
      return "creek"
  }
}
