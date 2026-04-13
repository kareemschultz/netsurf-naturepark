import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@workspace/ui/lib/utils";

// ─── Nav items ───────────────────────────────────────────────────────────────

type CommandItem = {
  label: string;
  url: string;
  group: string;
};

const commandItems: CommandItem[] = [
  { group: "Reservations", label: "Dashboard", url: "/" },
  { group: "Reservations", label: "Bookings", url: "/bookings" },
  { group: "Reservations", label: "Calendar", url: "/calendar" },
  { group: "Reservations", label: "Cabin Availability", url: "/cabins" },
  { group: "Reservations", label: "Blocked Dates", url: "/blocked" },
  { group: "Operations", label: "POS Terminal", url: "/pos" },
  { group: "Operations", label: "Products", url: "/products" },
  { group: "Operations", label: "Inventory", url: "/inventory" },
  { group: "Operations", label: "Stock Transfers", url: "/stock-transfers" },
  { group: "Operations", label: "Sales", url: "/sales" },
  { group: "Operations", label: "Reports", url: "/reports" },
  { group: "System", label: "Users & Access", url: "/users" },
  { group: "System", label: "Access Matrix", url: "/access" },
];

const groups = ["Reservations", "Operations", "System"];

// ─── CommandPalette ───────────────────────────────────────────────────────────

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const navigate = useNavigate();
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Also listen for the custom event dispatched by the header CmdK hint
  React.useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-command-palette", handler);
    return () => window.removeEventListener("open-command-palette", handler);
  }, []);

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return commandItems;
    return commandItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(url: string) {
    setOpen(false);
    navigate({ to: url as "/" });
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        {/* Panel */}
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[20%] z-50 w-full max-w-md -translate-x-[50%] rounded-xl border border-border bg-background shadow-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2",
            "focus:outline-none"
          )}
        >
          <DialogPrimitive.Title className="sr-only">
            Command Palette
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Search for pages and navigate quickly
          </DialogPrimitive.Description>

          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-3">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-muted-foreground"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:flex">
              Esc
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto p-2" aria-live="polite" aria-label="Search results">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              groups.map((group) => {
                const items = filtered.filter((i) => i.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <div className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {group}
                    </div>
                    {items.map((item) => (
                      <button
                        key={item.url}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none transition-colors",
                          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        )}
                        onClick={() => handleSelect(item.url)}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="shrink-0 text-muted-foreground/60"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                        {item.label}
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
