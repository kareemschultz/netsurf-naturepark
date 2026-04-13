import { Link } from "@tanstack/react-router";

export function Forbidden({ role }: { role?: string }) {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="admin-surface max-w-md rounded-3xl p-10 text-center shadow-[0_32px_80px_rgb(21_36_12_/12%)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200/80 bg-amber-50">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-600"
          >
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <p className="admin-kicker mb-2">403 — Access denied</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          You don't have access to this area
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          Your current role
          {role ? ` (${role})` : ""} doesn't have permission to view this page.
          Contact your administrator if you believe this is incorrect.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="admin-button-primary inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
