import { Link } from "@tanstack/react-router"
import { NatureArtwork } from "./NatureArtwork"

interface ErrorPageProps {
  code?: 404 | 500 | 403
  title?: string
  description?: string
}

const defaults: Record<
  404 | 500 | 403,
  { title: string; description: string }
> = {
  404: {
    title: "Page Not Found",
    description:
      "The page you're looking for has wandered off into the rainforest.",
  },
  500: {
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. We've noted it and will sort it out.",
  },
  403: {
    title: "Access Denied",
    description: "You don't have permission to view this page.",
  },
}

export function ErrorPage({
  code = 404,
  title,
  description,
}: ErrorPageProps) {
  const { title: defaultTitle, description: defaultDescription } =
    defaults[code]

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <NatureArtwork
        alt="A quiet corner of the rainforest at Netsurf Nature Park"
        variant="trail"
        className="mx-auto mb-8 aspect-[16/9] w-full max-w-sm rounded-[1.75rem] border-[#C4941A22]"
      />

      <span
        className="mb-3 inline-block rounded-full px-4 py-1.5 text-xs font-black tracking-[0.26em] text-white uppercase"
        style={{ backgroundColor: "#2D5016" }}
      >
        Error {code}
      </span>

      <h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
        {title ?? defaultTitle}
      </h1>

      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description ?? defaultDescription}
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#2D5016" }}
        >
          Back to Home
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary/20 px-7 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/6"
        >
          Contact Us
        </Link>
      </div>
    </div>
  )
}
