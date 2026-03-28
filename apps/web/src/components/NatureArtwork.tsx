import { useId } from "react"

import { cn } from "@workspace/ui/lib/utils"

export type NatureArtworkVariant =
  | "camp"
  | "hideaway"
  | "family"
  | "signature"
  | "creek"
  | "canopy"
  | "trail"
  | "fireside"

type Palette = {
  skyTop: string
  skyBottom: string
  glow: string
  hillDark: string
  hillMid: string
  hillLight: string
  water: string
  structure: string
  roof: string
  accent: string
  leaf: string
}

const palettes: Record<NatureArtworkVariant, Palette> = {
  camp: {
    skyTop: "#14351C",
    skyBottom: "#3A6B1E",
    glow: "#D1A84A",
    hillDark: "#173018",
    hillMid: "#2B5528",
    hillLight: "#477238",
    water: "#1E4950",
    structure: "#D8C19A",
    roof: "#6D4E31",
    accent: "#F0C867",
    leaf: "#7CA75B",
  },
  hideaway: {
    skyTop: "#163919",
    skyBottom: "#55833B",
    glow: "#E3C56B",
    hillDark: "#173018",
    hillMid: "#325D2D",
    hillLight: "#5C8C45",
    water: "#2E6672",
    structure: "#EDE0C5",
    roof: "#735131",
    accent: "#E7B34C",
    leaf: "#91B86E",
  },
  family: {
    skyTop: "#21421F",
    skyBottom: "#62864B",
    glow: "#EAC77C",
    hillDark: "#1B331C",
    hillMid: "#3F6538",
    hillLight: "#7BA55A",
    water: "#2D6478",
    structure: "#F1E3C8",
    roof: "#855B35",
    accent: "#F0B457",
    leaf: "#98C275",
  },
  signature: {
    skyTop: "#1E3415",
    skyBottom: "#446F2F",
    glow: "#F0CB73",
    hillDark: "#162A12",
    hillMid: "#2D5227",
    hillLight: "#648F48",
    water: "#244E65",
    structure: "#F5E8D2",
    roof: "#7A4A2A",
    accent: "#F0B44A",
    leaf: "#8EB667",
  },
  creek: {
    skyTop: "#204136",
    skyBottom: "#6CA177",
    glow: "#F2D382",
    hillDark: "#163127",
    hillMid: "#2A5C45",
    hillLight: "#5A8C69",
    water: "#163E4F",
    structure: "#E7D8B5",
    roof: "#886046",
    accent: "#F3C461",
    leaf: "#8CBF8E",
  },
  canopy: {
    skyTop: "#1F3518",
    skyBottom: "#507C3A",
    glow: "#E9CA7E",
    hillDark: "#11250F",
    hillMid: "#21411D",
    hillLight: "#3B6A2F",
    water: "#1D4D57",
    structure: "#E6D7BA",
    roof: "#755232",
    accent: "#DFAF4B",
    leaf: "#94BE62",
  },
  trail: {
    skyTop: "#243915",
    skyBottom: "#6C8E47",
    glow: "#EBC671",
    hillDark: "#172810",
    hillMid: "#355125",
    hillLight: "#6F9250",
    water: "#295565",
    structure: "#E8D8BA",
    roof: "#7A5334",
    accent: "#E5AF54",
    leaf: "#9BC475",
  },
  fireside: {
    skyTop: "#1D3012",
    skyBottom: "#516E31",
    glow: "#F3D17C",
    hillDark: "#152312",
    hillMid: "#2B4522",
    hillLight: "#55763D",
    water: "#234B58",
    structure: "#E7D4B1",
    roof: "#71482B",
    accent: "#FFB84D",
    leaf: "#86A95E",
  },
}

export function NatureArtwork({
  alt,
  variant,
  className,
  priority = false,
}: {
  alt: string
  variant: NatureArtworkVariant
  className?: string
  priority?: boolean
}) {
  const titleId = useId()
  const palette = palettes[variant]
  const showCabin =
    variant === "hideaway" || variant === "family" || variant === "signature"
  const showTent = variant === "camp"
  const showSolar =
    variant === "hideaway" || variant === "family" || variant === "signature"
  const showFire = variant === "camp" || variant === "fireside"
  const showPath = variant === "trail"
  const showWater =
    variant === "camp" ||
    variant === "creek" ||
    variant === "hideaway" ||
    variant === "family"

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-[inherit] border border-white/10 bg-[#1E3A0E]/10",
        className
      )}
    >
      <svg
        viewBox="0 0 640 420"
        role="img"
        aria-labelledby={titleId}
        className="h-full w-full"
        width="640"
        height="420"
        preserveAspectRatio="xMidYMid slice"
      >
        <title id={titleId}>{alt}</title>
        <defs>
          <linearGradient id={`${titleId}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.skyTop} />
            <stop offset="100%" stopColor={palette.skyBottom} />
          </linearGradient>
          <linearGradient id={`${titleId}-water`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.water} />
            <stop offset="100%" stopColor="#6CA9A8" />
          </linearGradient>
          <radialGradient id={`${titleId}-sun`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#FFF5CD" />
            <stop offset="60%" stopColor={palette.glow} />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <filter
            id={`${titleId}-blur`}
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <rect width="640" height="420" fill={`url(#${titleId}-sky)`} />
        <circle
          cx="510"
          cy="72"
          r="78"
          fill={`url(#${titleId}-sun)`}
          opacity="0.9"
        />
        <ellipse
          cx="150"
          cy="118"
          rx="180"
          ry="52"
          fill="#FFFFFF"
          opacity="0.1"
          filter={`url(#${titleId}-blur)`}
        />
        <ellipse
          cx="470"
          cy="154"
          rx="220"
          ry="44"
          fill="#FFFFFF"
          opacity="0.08"
          filter={`url(#${titleId}-blur)`}
        />

        <path
          d="M0 244C78 220 138 212 205 226C264 239 342 238 402 220C478 198 545 193 640 224V420H0Z"
          fill={palette.hillLight}
        />
        <path
          d="M0 266C97 240 153 247 229 262C311 278 384 278 463 250C534 225 590 229 640 243V420H0Z"
          fill={palette.hillMid}
        />
        <path
          d="M0 299C72 286 145 279 219 290C307 302 380 320 463 305C545 289 602 297 640 309V420H0Z"
          fill={palette.hillDark}
        />

        {showWater && (
          <>
            <path
              d="M52 420C146 339 234 294 322 282C393 272 446 284 490 304C537 324 583 349 640 372V420Z"
              fill={`url(#${titleId}-water)`}
              opacity="0.96"
            />
            <path
              d="M160 350C227 319 305 299 377 302C431 305 497 329 562 358"
              fill="none"
              stroke="#9AD5D1"
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.45"
            />
          </>
        )}

        {showPath && (
          <path
            d="M354 420C317 372 282 338 245 314C213 294 177 283 123 275"
            fill="none"
            stroke="#D6C2A1"
            strokeWidth="34"
            strokeLinecap="round"
            opacity="0.78"
          />
        )}

        <g opacity="0.92">
          <rect x="66" y="154" width="14" height="214" rx="7" fill="#173018" />
          <circle cx="73" cy="136" r="46" fill={palette.leaf} />
          <circle cx="106" cy="150" r="34" fill={palette.leaf} opacity="0.88" />
          <circle cx="42" cy="152" r="30" fill={palette.leaf} opacity="0.86" />

          <rect x="560" y="138" width="16" height="222" rx="8" fill="#173018" />
          <circle cx="568" cy="118" r="44" fill={palette.leaf} />
          <circle cx="603" cy="138" r="34" fill={palette.leaf} opacity="0.85" />
          <circle cx="530" cy="145" r="30" fill={palette.leaf} opacity="0.82" />
        </g>

        {showCabin && (
          <g>
            <rect
              x={variant === "signature" ? "360" : "332"}
              y={variant === "signature" ? "200" : "214"}
              width={variant === "signature" ? "156" : "126"}
              height={variant === "signature" ? "94" : "82"}
              rx="14"
              fill={palette.structure}
            />
            <path
              d={
                variant === "signature"
                  ? "M340 216L438 150L536 216"
                  : "M316 226L396 170L476 226"
              }
              fill="none"
              stroke={palette.roof}
              strokeWidth="26"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <rect
              x={variant === "signature" ? "422" : "381"}
              y={variant === "signature" ? "228" : "236"}
              width="28"
              height={variant === "signature" ? "66" : "60"}
              rx="10"
              fill={palette.roof}
            />
            <rect
              x={variant === "signature" ? "382" : "346"}
              y={variant === "signature" ? "234" : "244"}
              width="28"
              height="40"
              rx="10"
              fill="#F7F1E4"
              opacity="0.94"
            />
            <rect
              x={variant === "signature" ? "462" : "425"}
              y={variant === "signature" ? "234" : "244"}
              width="28"
              height="40"
              rx="10"
              fill="#F7F1E4"
              opacity="0.94"
            />
            <rect
              x={variant === "signature" ? "421" : "390"}
              y={variant === "signature" ? "244" : "252"}
              width="34"
              height={variant === "signature" ? "50" : "44"}
              rx="12"
              fill="#5F4127"
            />
            {variant === "signature" && (
              <path
                d="M520 292H350L322 316H548Z"
                fill="#B78A54"
                opacity="0.84"
              />
            )}
          </g>
        )}

        {showSolar && (
          <g opacity="0.95">
            <path d="M286 286L350 258L374 290L308 316Z" fill="#18384B" />
            <path d="M291 288L346 264" stroke="#87B6D4" strokeWidth="4" />
            <path d="M300 302L356 279" stroke="#87B6D4" strokeWidth="4" />
            <path d="M316 315L370 293" stroke="#87B6D4" strokeWidth="4" />
            <path
              d="M332 256L347 223"
              stroke="#6A5A48"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        )}

        {showTent && (
          <g>
            <path d="M302 320L366 212L428 320Z" fill="#F4E4B2" />
            <path d="M366 212L428 320H382L366 292Z" fill="#D69A3E" />
            <path d="M352 320L366 212L378 320Z" fill="#6A4626" opacity="0.88" />
            <path
              d="M271 322C316 302 357 299 398 304C440 309 478 320 522 340"
              fill="none"
              stroke="#88AE62"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        )}

        {showFire && (
          <g>
            <ellipse
              cx="258"
              cy="320"
              rx="28"
              ry="12"
              fill="#4E3422"
              opacity="0.85"
            />
            <path d="M251 322L265 294L276 322Z" fill="#FF9C45" />
            <path d="M257 319L265 300L271 319Z" fill="#FFE18A" />
            <path
              d="M232 326L244 316"
              stroke="#7B5330"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M271 327L284 316"
              stroke="#7B5330"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        )}

        <g opacity={priority ? "1" : "0.86"}>
          <circle cx="146" cy="88" r="3" fill="#FFF4C8" />
          <circle cx="186" cy="112" r="2.6" fill="#FFF4C8" opacity="0.72" />
          <circle cx="234" cy="72" r="2.4" fill="#FFF4C8" opacity="0.75" />
          <circle cx="538" cy="134" r="2.8" fill="#FFF4C8" opacity="0.72" />
          <circle cx="495" cy="172" r="2.2" fill="#FFF4C8" opacity="0.62" />
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#102411]/55 to-transparent" />
    </div>
  )
}
