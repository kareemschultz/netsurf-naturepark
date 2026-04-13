import { Link } from "@tanstack/react-router";

export function NotFound() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <div className="admin-surface max-w-md rounded-3xl p-10 text-center shadow-[0_32px_80px_rgb(21_36_12_/12%)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/10 bg-primary/6">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        </div>

        <p className="admin-kicker mb-2">404 — Page not found</p>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          This path leads into the forest
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved. Head back to the
          dashboard to find your way.
        </p>

        <div className="mt-7">
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
