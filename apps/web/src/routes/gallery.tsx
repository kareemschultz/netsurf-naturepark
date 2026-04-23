import { useState, useCallback } from "react"

import { createFileRoute } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"

import { galleryImages } from "@workspace/shared"
import type { GalleryCategory, GalleryImage } from "@workspace/shared"

import { AnimatedPageHero } from "../components/AnimatedHeroBg"
import { BlurFade } from "../components/BlurFade"
import {
  NatureArtwork,
  type NatureArtworkVariant,
} from "../components/NatureArtwork"
import { fetchManagedPhotos, toUploadUrl } from "../lib/content"

export const Route = createFileRoute("/gallery")({
  loader: async () => {
    try {
      const photos = await fetchManagedPhotos("gallery")
      return {
        managedImages: photos.map((photo) => ({
          src: toUploadUrl(photo.filename),
          alt: photo.altText || photo.caption || "Netsurf Nature Park photo",
          category: "experiences" as GalleryCategory,
        })),
      }
    } catch {
      return { managedImages: [] as GalleryImage[] }
    }
  },
  component: GalleryPage,
})

const categoryLabels: Record<GalleryCategory, string> = {
  all: "All",
  cabins: "Cabins",
  "creek-nature": "Creek & Nature",
  experiences: "Experiences",
  "park-life": "Park Life",
}

const allCategories: GalleryCategory[] = [
  "all",
  "cabins",
  "creek-nature",
  "experiences",
  "park-life",
]

// Fallback artwork variants per image index
const artworkVariants: NatureArtworkVariant[] = [
  "creek",
  "hideaway",
  "family",
  "hideaway",
  "signature",
  "fireside",
  "trail",
  "creek",
  "canopy",
  "canopy",
  "fireside",
  "camp",
]

function GalleryPage() {
  const { managedImages } = Route.useLoaderData()
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const sourceImages = managedImages.length > 0 ? managedImages : galleryImages

  const filtered =
    activeCategory === "all"
      ? sourceImages
      : sourceImages.filter((img) => img.category === activeCategory)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % filtered.length
    )
  }, [filtered.length])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + filtered.length) % filtered.length
    )
  }, [filtered.length])

  return (
    <>
      <AnimatedPageHero
        eyebrow="Gallery"
        title="Explore the Park"
        subtitle="A visual journey through the rainforest, the creek, and the cabins of Netsurf Nature Park."
      />

      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto max-w-6xl">
          {/* Category filters */}
          <BlurFade inView>
            <div
              role="tablist"
              aria-label="Filter gallery by category"
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
                      ? {
                          backgroundColor: "#2D5016",
                          color: "#fff",
                          borderColor: "#2D5016",
                        }
                      : {
                          backgroundColor: "transparent",
                          color: "#2D5016",
                          borderColor: "#2D5016",
                        }
                  }
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </BlurFade>

          {/* Masonry grid */}
          <div
            className="columns-1 gap-4 sm:columns-2 lg:columns-3"
            style={{ columnFill: "balance" }}
          >
            <AnimatePresence mode="sync">
              {filtered.map((image, i) => {
                const globalIndex = sourceImages.indexOf(image)
                const fallbackVariant =
                  artworkVariants[globalIndex % artworkVariants.length] ??
                  "creek"

                return (
                  <BlurFade
                    key={image.src}
                    delay={i * 0.07}
                    inView
                    className="mb-4 break-inside-avoid"
                  >
                    <GalleryCard
                      image={image}
                      fallbackVariant={fallbackVariant}
                      onClick={() => openLightbox(i)}
                    />
                  </BlurFade>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={filtered}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={goNext}
            onPrev={goPrev}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function GalleryCard({
  image,
  fallbackVariant,
  onClick,
}: {
  image: GalleryImage
  fallbackVariant: NatureArtworkVariant
  onClick: () => void
}) {
  const [failed, setFailed] = useState(false)

  return (
    <motion.figure
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
      onClick={onClick}
      tabIndex={0}
      role="button"
      aria-label={`View: ${image.alt}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {failed ? (
        <NatureArtwork
          alt={image.alt}
          variant={fallbackVariant}
          className="w-full rounded-none border-0"
        />
      ) : (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      )}
      <figcaption className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        {image.alt}
      </figcaption>
    </motion.figure>
  )
}

function Lightbox({
  images,
  index,
  onClose,
  onNext,
  onPrev,
}: {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}) {
  const image = images[index]
  if (!image) return null

  return (
    <motion.div
      key="lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close lightbox"
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <CloseIcon />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onPrev()
        }}
        aria-label="Previous image"
        className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <ChevronLeftIcon />
      </button>

      {/* Next */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onNext()
        }}
        aria-label="Next image"
        className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <ChevronRightIcon />
      </button>

      {/* Image */}
      <motion.div
        key={index}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
        className="max-h-[85vh] max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.src}
          alt={image.alt}
          loading="eager"
          decoding="async"
          className="max-h-[80vh] max-w-full object-contain"
        />
        <div className="bg-black/60 px-5 py-3">
          <p className="text-sm text-white/80">{image.alt}</p>
          <p className="mt-0.5 text-xs text-white/45">
            {index + 1} / {images.length}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
