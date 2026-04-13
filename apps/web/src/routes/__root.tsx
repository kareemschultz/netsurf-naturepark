import { createRootRoute, Outlet } from "@tanstack/react-router"
import { MotionConfig } from "framer-motion"

import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { WhatsAppFAB } from "@/components/WhatsAppFAB"
import { ErrorPage } from "@/components/ErrorPage"

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorPage code={404} />
      </main>
      <Footer />
    </div>
  )
}

function RootErrorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ErrorPage code={500} />
      </main>
      <Footer />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  errorComponent: RootErrorPage,
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
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Outlet />
        </main>
        <Footer />
        <WhatsAppFAB />
      </div>
    </MotionConfig>
  )
}
