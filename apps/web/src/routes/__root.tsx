import { createRootRoute, Outlet } from "@tanstack/react-router"
import { MotionConfig } from "framer-motion"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { WhatsAppFAB } from "@/components/WhatsAppFAB"

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFAB />
      </div>
    </MotionConfig>
  )
}
