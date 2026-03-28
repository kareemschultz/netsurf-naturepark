import type { Cabin } from "@workspace/shared"

import type { NatureArtworkVariant } from "./NatureArtwork"

export function getCabinArtworkVariant(cabin: Cabin): NatureArtworkVariant {
  switch (cabin.slug) {
    case "camping-site":
      return "camp"
    case "nature-cabin":
      return "hideaway"
    case "medium-cabin":
      return "family"
    case "hansel-and-gretel-cabin":
      return "signature"
    default:
      return "creek"
  }
}
