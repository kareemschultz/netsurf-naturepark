import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { SidebarTrigger } from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import { normalizeAdminPathname } from "@/lib/auth";

// ─── Route label map ──────────────────────────────────────────────────────────

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  bookings: "Bookings",
  calendar: "Calendar",
  cabins: "Cabin Availability",
  blocked: "Blocked Dates",
  pos: "POS Terminal",
  products: "Products",
  inventory: "Inventory",
  "stock-transfers": "Stock Transfers",
  sales: "Sales",
  reports: "Reports",
  gallery: "Gallery",
  users: "Users & Access",
  access: "Access Matrix",
  login: "Login",
};

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

function Breadcrumb() {
  const { location } = useRouterState();
  const pathname = normalizeAdminPathname(location.pathname);

  const segments = pathname.replace(/^\//, "").split("/").filter(Boolean);

  const crumbs: Array<{ label: string; path: string }> = [
    { label: "Admin", path: "/" },
  ];

  segments.forEach((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = routeLabels[seg] ?? seg;
    crumbs.push({ label, path });
  });

  // Only show the last 2 crumbs when deep
  const visibleCrumbs = crumbs.slice(-2);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {visibleCrumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1">
          {i > 0 && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground/50"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          )}
          <span
            className={cn(
              i === visibleCrumbs.length - 1
                ? "font-semibold text-foreground"
                : "text-muted-foreground"
            )}
          >
            {crumb.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

// ─── Vertical separator ───────────────────────────────────────────────────────

function VerticalSeparator() {
  return <div className="h-6 w-px bg-border" />;
}

// ─── Header ───────────────────────────────────────────────────────────────────

type HeaderProps = React.HTMLAttributes<HTMLElement> & {
  fixed?: boolean;
};

export function Header({ className, fixed, children, ...props }: HeaderProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setOffset(document.body.scrollTop || document.documentElement.scrollTop);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4",
        fixed && "sticky top-0 w-full",
        fixed && offset > 10 && "shadow-sm",
        className
      )}
      {...props}
    >
      <SidebarTrigger className="-ml-1" />
      <VerticalSeparator />
      <Breadcrumb />
      <div className="ms-auto flex items-center gap-2">
        {children}
        <CmdKHint />
      </div>
    </header>
  );
}

// ─── Cmd+K hint ───────────────────────────────────────────────────────────────

function CmdKHint() {
  return (
    <button
      type="button"
      className={cn(
        "hidden items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted md:flex"
      )}
      aria-label="Open command palette"
      onClick={() => {
        // Dispatch a custom event — CommandPalette listens for it
        window.dispatchEvent(new CustomEvent("open-command-palette"));
      }}
    >
      <span>Search</span>
      <kbd className="pointer-events-none flex h-4 items-center gap-0.5 rounded border border-border bg-background px-1 font-mono text-[10px]">
        <span>⌘</span>
        <span>K</span>
      </kbd>
    </button>
  );
}
