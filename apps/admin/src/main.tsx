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
    <div className="admin-shell flex min-h-screen items-center justify-center px-4 py-6">
      <div className="admin-surface max-w-lg rounded-[2.2rem] px-8 py-10 text-center shadow-[0_24px_60px_rgb(21_36_12_/14%)]">
        <div
          className={[
            "mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] border",
            tone === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-primary/12 bg-primary/8 text-primary",
          ].join(" ")}
        >
          {tone === "error" ? (
            <svg
              width="24"
              height="24"
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
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
        </div>

        <p className="admin-kicker mt-5">Netsurf Admin</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
