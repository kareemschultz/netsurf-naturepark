import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { login } from "@/lib/api";
import { fetchAdminSession, getSessionLandingPath } from "@/lib/auth";

const workspaceModules = [
  {
    title: "Reservations",
    detail: "Bookings, calendar control, and blocked dates in one queue.",
  },
  {
    title: "POS Terminal",
    detail: "Walk-in checkout, receipts, and a cleaner front-desk flow.",
  },
  {
    title: "Inventory",
    detail: "Low-stock visibility, transfers, and product controls.",
  },
  {
    title: "Reporting",
    detail: "Sales summaries, exports, and role-aware oversight.",
  },
] as const;

const loginSignals = [
  {
    label: "Session Model",
    value: "Named staff accounts with RBAC",
  },
  {
    label: "Catalog",
    value: "Workbook-seeded beverage products",
  },
  {
    label: "Workspace",
    value: "Bookings, POS, stock, and reports",
  },
] as const;

const controlSteps = [
  "Review arrivals, blocked dates, and cabin occupancy.",
  "Open the POS terminal for front-desk or concession sales.",
  "Track low stock, transfers, and close-of-day summaries.",
] as const;

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const session = await fetchAdminSession();
    if (session) throw redirect({ to: getSessionLandingPath(session) });
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      const session = await fetchAdminSession();
      startTransition(() => {
        navigate({ to: getSessionLandingPath(session) });
      });
    } catch (loginError) {
      setError(
        (loginError as Error).message || "Unable to sign in. Check your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-shell relative isolate min-h-screen overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="admin-login-grid absolute inset-0" />
        <div className="admin-login-topography absolute inset-0" />
        <motion.div
          aria-hidden
          className="absolute -left-16 top-10 h-64 w-64 rounded-full bg-[rgb(196_148_26_/20%)] blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, 36, -18, 0],
                  y: [0, 24, -14, 0],
                  scale: [1, 1.06, 0.96, 1],
                }
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute right-[-7rem] top-[18%] h-80 w-80 rounded-full bg-[rgb(45_80_22_/18%)] blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -42, 24, 0],
                  y: [0, -22, 18, 0],
                  scale: [1, 0.94, 1.08, 1],
                }
          }
          transition={{
            duration: 24,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-[-5rem] left-[28%] h-72 w-72 rounded-full bg-[rgb(255_255_255_/24%)] blur-3xl"
          animate={
            reduceMotion
              ? undefined
              : {
                  x: [0, -18, 28, 0],
                  y: [0, -32, 8, 0],
                  opacity: [0.4, 0.6, 0.42, 0.4],
                }
          }
          transition={{
            duration: 22,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="admin-surface admin-surface-dark admin-login-hero hidden min-h-[calc(100vh-2rem)] flex-col rounded-3xl p-8 text-white xl:flex xl:p-9 2xl:p-10"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2 3 7l9 5 9-5-9-5Z" />
                  <path d="M3 12 12 17l9-5" />
                  <path d="M3 17 12 22l9-5" />
                </svg>
              </div>
              <div>
                <p className="font-heading text-xl font-black tracking-tight">
                  Netsurf Admin
                </p>
                <p className="text-[11px] tracking-[0.24em] text-white/48 uppercase">
                  Park operations console
                </p>
              </div>
            </div>

            <div className="rounded-full border border-white/10 bg-white/7 px-4 py-2 text-[11px] font-bold tracking-[0.22em] text-white/58 uppercase">
              Staff-only access
            </div>
          </div>

          <div className="relative mt-8 flex flex-1 flex-col justify-between gap-8">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] xl:items-start">
              <div className="max-w-2xl">
                <p className="admin-kicker text-white/58">
                  Designed for daily park operations
                </p>
                <h1 className="mt-4 max-w-[14ch] text-6xl leading-[0.94] font-black tracking-[-0.04em] text-white">
                  A calmer control room for bookings, retail, and stock.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/72">
                  The admin now brings cabin availability, blocked dates, beverage
                  sales, staff permissions, and inventory movement into one polished
                  workspace instead of scattered screens.
                </p>

                <div className="mt-8 grid gap-3 md:grid-cols-2">
                  {workspaceModules.map((module, index) => (
                    <motion.div
                      key={module.title}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? undefined
                          : {
                              delay: 0.12 + index * 0.06,
                              duration: 0.36,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      className="admin-login-signal rounded-[1.6rem] px-5 py-5"
                    >
                      <p className="text-[11px] font-bold tracking-[0.22em] text-white/42 uppercase">
                        {module.title}
                      </p>
                      <p className="mt-3 text-base font-bold text-white">
                        {module.detail}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={
                    reduceMotion
                      ? undefined
                      : { delay: 0.18, duration: 0.44, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="admin-login-terminal rounded-[1.9rem] p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.22em] text-white/42 uppercase">
                        Opening sequence
                      </p>
                      <p className="mt-2 text-lg font-black tracking-tight text-white">
                        What staff can do right after sign-in
                      </p>
                    </div>

                    <div className="flex gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/26" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/18" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {controlSteps.map((step, index) => (
                      <div
                        key={step}
                        className="flex gap-3 rounded-[1.3rem] border border-white/8 bg-white/5 px-4 py-3.5"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-200/24 bg-amber-300/14 text-xs font-black text-amber-100">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-6 text-white/74">{step}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                  {loginSignals.map((signal, index) => (
                    <motion.div
                      key={signal.label}
                      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                      transition={
                        reduceMotion
                          ? undefined
                          : {
                              delay: 0.24 + index * 0.06,
                              duration: 0.34,
                              ease: [0.22, 1, 0.36, 1],
                            }
                      }
                      className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-4"
                    >
                      <p className="text-[11px] font-bold tracking-[0.2em] text-white/42 uppercase">
                        {signal.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/82">
                        {signal.value}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-white/6 p-5 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-[11px] font-bold tracking-[0.22em] text-white/42 uppercase">
                  Live workspace
                </p>
                <p className="mt-3 text-xl font-black tracking-tight text-white">
                  Better Auth sessions are active across the admin.
                </p>
              </div>

              <p className="text-sm leading-7 text-white/68">
                This release replaces the old shared-password flow with named users,
                session-backed access, protected navigation, and route-aware
                permissions for the operations team.
              </p>
            </div>
          </div>
        </motion.section>

        <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-5">
          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.56, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="admin-surface admin-login-panel flex min-h-[calc(100vh-2rem)] rounded-3xl p-6 sm:p-8 lg:p-10"
          >
            <div className="relative z-10 mx-auto flex w-full max-w-md flex-col justify-center">
              <div className="xl:hidden">
                <div className="rounded-[1.7rem] border border-primary/10 bg-white/62 px-5 py-5 shadow-[0_18px_40px_rgb(21_36_12_/8%)] backdrop-blur-xl">
                  <p className="admin-kicker">Operations workspace</p>
                  <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
                    Sign in to open bookings, POS, and inventory controls.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {workspaceModules.slice(0, 3).map((module) => (
                      <span
                        key={module.title}
                        className="rounded-full border border-primary/10 bg-primary/6 px-3 py-1.5 text-[11px] font-bold tracking-[0.18em] text-primary uppercase"
                      >
                        {module.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 xl:mt-0">
                <div className="flex flex-wrap gap-2">
                  <span className="admin-login-pill">Secure access</span>
                  <span className="admin-login-pill">Username sign-in</span>
                  <span className="admin-login-pill">Session backed</span>
                </div>

                <h1 className="mt-5 max-w-[12ch] text-4xl leading-[0.96] font-black tracking-[-0.04em] text-foreground sm:text-5xl">
                  Sign in to the park control desk.
                </h1>
                <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
                  Use your staff username and password to unlock the redesigned
                  admin workspace for reservations, retail, reports, blocked dates,
                  and user access.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="block">
                  <label
                    htmlFor="login-username"
                    className="mb-2.5 block text-sm font-bold text-foreground"
                  >
                    Username
                  </label>
                  <div className="admin-input flex items-center gap-3 rounded-2xl px-4 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/6 text-primary" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="8" r="4" />
                      </svg>
                    </span>
                    <input
                      id="login-username"
                      name="username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="Enter your staff username"
                      required
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    />
                  </div>
                </div>

                <div className="block">
                  <label
                    htmlFor="login-password"
                    className="mb-2.5 block text-sm font-bold text-foreground"
                  >
                    Password
                  </label>
                  <div className="admin-input flex items-center gap-3 rounded-2xl px-4 py-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/6 text-primary" aria-hidden="true">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="4" y="11" width="16" height="9" rx="2" />
                        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
                      </svg>
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((current) => !current)}
                      className="shrink-0 rounded-full border border-primary/10 bg-primary/6 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error ? (
                  <div
                    className="rounded-[1.35rem] border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-medium text-red-700 shadow-[0_10px_24px_rgb(239_68_68_/8%)]"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="admin-button-primary w-full rounded-[1.35rem] px-5 py-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Enter Admin Workspace"}
                </button>
              </form>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {loginSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[1.35rem] border border-primary/8 bg-white/66 px-4 py-4 shadow-[0_14px_30px_rgb(21_36_12_/6%)]"
                  >
                    <p className="text-[11px] font-bold tracking-[0.18em] text-primary/62 uppercase">
                      {signal.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground/82">
                      {signal.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-primary/8 bg-primary/4 px-5 py-5">
                <p className="text-sm font-semibold text-foreground">
                  The new admin is built for actual staff flow, not a generic
                  dashboard shell.
                </p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  After sign-in, navigation is trimmed to your role and the session
                  stays on secure Better Auth cookies instead of the old
                  shared-password gate.
                </p>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="admin-surface rounded-[2rem] p-5 xl:hidden"
          >
            <p className="admin-kicker">Live in this release</p>
            <div className="mt-4 space-y-3">
              {controlSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-3 rounded-[1.2rem] border border-primary/8 bg-white/64 px-4 py-3.5"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/6 text-xs font-black text-primary">
                    0{index + 1}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
