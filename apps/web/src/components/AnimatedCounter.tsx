import { useEffect, useRef, type ComponentPropsWithoutRef } from "react"
import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion"

import { cn } from "@workspace/ui/lib/utils"

interface AnimatedCounterProps extends ComponentPropsWithoutRef<"span"> {
  value: number
  startValue?: number
  direction?: "up" | "down"
  delay?: number
  decimalPlaces?: number
  suffix?: string
  prefix?: string
}

export function AnimatedCounter({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  suffix = "",
  prefix = "",
  ...props
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : startValue)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { once: true, margin: "0px" })
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    // If reduced motion, immediately show final value without animation
    if (shouldReduceMotion) {
      if (ref.current) {
        const formatted = Intl.NumberFormat("en-US", {
          minimumFractionDigits: decimalPlaces,
          maximumFractionDigits: decimalPlaces,
        }).format(Number(value.toFixed(decimalPlaces)))
        ref.current.textContent = `${prefix}${formatted}${suffix}`
      }
      return
    }

    let timer: ReturnType<typeof setTimeout> | null = null

    if (isInView) {
      timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value)
      }, delay * 1000)
    }

    return () => {
      if (timer !== null) {
        clearTimeout(timer)
      }
    }
  }, [
    motionValue,
    isInView,
    delay,
    value,
    direction,
    startValue,
    shouldReduceMotion,
    decimalPlaces,
    prefix,
    suffix,
  ])

  useEffect(
    () =>
      springValue.on("change", (latest) => {
        if (ref.current && !shouldReduceMotion) {
          const formatted = Intl.NumberFormat("en-US", {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
          }).format(Number(latest.toFixed(decimalPlaces)))
          ref.current.textContent = `${prefix}${formatted}${suffix}`
        }
      }),
    [springValue, decimalPlaces, prefix, suffix, shouldReduceMotion]
  )

  const initialDisplay = shouldReduceMotion
    ? `${prefix}${Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(value)}${suffix}`
    : `${prefix}${startValue}${suffix}`

  return (
    <span
      ref={ref}
      className={cn("inline-block tabular-nums tracking-wider", className)}
      {...props}
    >
      {initialDisplay}
    </span>
  )
}
