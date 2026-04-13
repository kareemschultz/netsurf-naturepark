import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import "@workspace/ui/globals.css";
import "./admin.css";

const router = createRouter({
  routeTree,
  basepath: '/admin',
  defaultPreload: "intent",
  defaultPendingComponent: AdminBootScreen,
  defaultErrorComponent: ({ error }) => (
    <AdminBootScreen
      title="Admin failed to load"
      body={
        error instanceof Error
          ? error.message
          : "A client-side error interrupted the admin bootstrap."
      }
      tone="error"
    />
  ),
  context: {},
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

function AdminBootScreen({
  title = "Loading admin",
  body = "Preparing the operations console and staff session state.",
  tone = "neutral",
}: {
  title?: string;
  body?: string;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-6">
      <div className="max-w-lg rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm">
        <div
          className={[
            "mx-auto flex h-14 w-14 items-center justify-center rounded-xl border",
            tone === "error"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-primary/20 bg-primary/10 text-primary",
          ].join(" ")}
        >
          {tone === "error" ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16h.01" />
            </svg>
          ) : (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </div>

        <p className="mt-4 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Netsurf Admin
        </p>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
