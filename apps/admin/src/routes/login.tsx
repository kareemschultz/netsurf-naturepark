import { useState } from "react"
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router"
import { login, isAuthenticated } from "@/lib/api"

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" })
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(password)
      navigate({ to: "/" })
    } catch {
      setError("Incorrect password. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: "#1E3A0E" }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-7 text-center">
          <p className="text-xl font-black" style={{ color: "#2D5016" }}>
            Netsurf Admin
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage bookings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-password"
              className="mb-1.5 block text-sm font-semibold"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              className="w-full rounded-xl border-2 border-border px-4 py-2.5 text-sm transition-colors outline-none focus:border-[#2D5016]"
            />
          </div>

          {error && (
            <p className="text-xs font-medium text-red-600" aria-live="polite">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2D5016" }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  )
}
