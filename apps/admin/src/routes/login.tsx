import type { FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { login } from "@/lib/api";
import { fetchAdminSession, getSessionLandingPath } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await fetchAdminSession();
    if (session) throw redirect({ to: getSessionLandingPath(session) });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      const session = await fetchAdminSession();
      navigate({ to: getSessionLandingPath(session) });
    } catch (loginError) {
      setError((loginError as Error).message || "Unable to sign in. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-6">
      <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="admin-surface hidden min-h-[620px] rounded-[2.3rem] bg-[radial-gradient(circle_at_top_left,rgba(196,148,26,0.18),transparent_26%),linear-gradient(135deg,#18310d,#214315)] p-8 text-white lg:flex lg:flex-col"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 3 7l9 5 9-5-9-5Z" />
                <path d="M3 12 12 17l9-5" />
                <path d="M3 17 12 22l9-5" />
              </svg>
            </div>
            <div>
              <p className="font-heading text-xl font-black tracking-tight">Netsurf Admin</p>
              <p className="text-[11px] tracking-[0.24em] text-white/48 uppercase">
                Premium operations console
              </p>
            </div>
          </div>

          <div className="my-auto max-w-xl">
            <p className="admin-kicker text-white/55">Reservation and POS control</p>
            <h1 className="mt-4 text-5xl leading-none font-black tracking-tight">
              Run bookings, sales, and stock from one calm workspace.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/72">
              The redesigned admin brings together guest approvals, POS checkout, beverage inventory, transfer workflows, and reporting without forcing staff to bounce between disconnected tools.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                "Bookings and cabin availability",
                "POS, sales, and receipt flow",
                "Workbook-seeded beverage catalog",
                "Charts, exports, and stock visibility",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-white/10 bg-white/8 px-4 py-4 text-sm font-semibold text-white/82"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4">
            <p className="text-xs font-bold tracking-[0.22em] text-white/45 uppercase">
              Session model
            </p>
            <p className="mt-2 text-sm leading-6 text-white/68">
              Named staff accounts, role-based access, and cookie-backed sessions now replace the old shared-password admin flow.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="admin-surface rounded-[2.3rem] p-6 sm:p-8 lg:p-10"
        >
          <div className="mx-auto flex max-w-md flex-col justify-center lg:min-h-[620px]">
            <p className="admin-kicker">Secure access</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              Sign in to the admin panel
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use your staff username and password to open the operations console for bookings, POS, inventory, and reporting.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-foreground">Username</span>
                <input
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Enter your staff username"
                  required
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3.5 text-sm outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-foreground">Password</span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  required
                  className="admin-input w-full rounded-[1.2rem] px-4 py-3.5 text-sm outline-none"
                />
              </label>

              {error ? (
                <div
                  className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  aria-live="polite"
                >
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="admin-button-primary w-full rounded-[1.2rem] px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Enter Admin"}
              </button>
            </form>

            <div className="mt-6 rounded-[1.2rem] border border-primary/8 bg-primary/4 px-4 py-4">
              <p className="text-sm font-semibold text-foreground">What is live in this workspace</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                POS, stock transfers, inventory controls, sales reporting, catalog exports, and workbook-seeded beverage products.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
