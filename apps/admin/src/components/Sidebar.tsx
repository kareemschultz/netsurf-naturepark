import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { logout } from "@/lib/api";
import { cn } from "@workspace/ui/lib/utils";

type NavItem = {
  to: "/" | "/bookings" | "/calendar" | "/blocked" | "/pos" | "/products" | "/inventory" | "/stock-transfers" | "/sales" | "/reports" | "/cabins";
  label: string;
  description: string;
  icon: ReactNode;
};

const reservationItems: NavItem[] = [
  {
    to: "/",
    label: "Dashboard",
    description: "Overview, priorities, and fast actions",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: "/bookings",
    label: "Bookings",
    description: "Requests, confirmations, and guest records",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </svg>
    ),
  },
  {
    to: "/calendar",
    label: "Calendar",
    description: "Monthly cabin occupancy and timing",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    to: "/blocked",
    label: "Blocked Dates",
    description: "Maintenance, closures, and overrides",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="m7 7 10 10" />
      </svg>
    ),
  },
];

const operationsItems: NavItem[] = [
  {
    to: "/pos",
    label: "POS",
    description: "Sales terminal and checkout flow",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M6 9h12" />
        <path d="M7 13h4" />
      </svg>
    ),
  },
  {
    to: "/products",
    label: "Products",
    description: "Catalog, menus, pricing, and categories",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    ),
  },
  {
    to: "/inventory",
    label: "Inventory",
    description: "Stock health, adjustments, and restocks",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
        <path d="M3 12 12 16.5 21 12" />
        <path d="M3 16.5 12 21l9-4.5" />
      </svg>
    ),
  },
  {
    to: "/stock-transfers",
    label: "Transfers",
    description: "Dispatches between park and outpost",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 9h11" />
        <path d="m12 5 4 4-4 4" />
        <path d="M19 15H8" />
        <path d="m12 11-4 4 4 4" />
      </svg>
    ),
  },
  {
    to: "/sales",
    label: "Sales",
    description: "Revenue, payment mix, and sale history",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 3 3 5-7" />
      </svg>
    ),
  },
  {
    to: "/reports",
    label: "Reports",
    description: "Charts, summaries, and export-ready insights",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 15V9" />
        <path d="M12 15V6" />
        <path d="M17 15v-3" />
      </svg>
    ),
  },
  {
    to: "/cabins",
    label: "Cabins",
    description: "Live day-use and overnight cabin board",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11 12 4l9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
];

const mobilePrimaryItems = [reservationItems[0], reservationItems[1], operationsItems[0], operationsItems[2], operationsItems[4]];

const navSections = [
  {
    title: "Reservations",
    blurb: "Bookings, occupancy, and exceptions",
    items: reservationItems,
  },
  {
    title: "Operations",
    blurb: "POS, catalog, stock, and revenue",
    items: operationsItems,
  },
] as const;

const routeTitles = [...reservationItems, ...operationsItems].reduce<Record<string, string>>(
  (acc, item) => {
    acc[item.to] = item.label;
    return acc;
  },
  {}
);

function isActivePath(pathname: string, path: NavItem["to"]) {
  return path === "/" ? pathname === "/" : pathname.startsWith(path);
}

function SidebarBody({
  pathname,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const nowLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );

  return (
    <div className="admin-surface flex h-full flex-col rounded-[2rem] border border-white/12 bg-[#17300d]/95 text-white shadow-[0_24px_80px_rgb(18_34_9_/38%)]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 shadow-[inset_0_1px_0_rgb(255_255_255_/10%)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 3 7l9 5 9-5-9-5Z" />
              <path d="M3 12 12 17l9-5" />
              <path d="M3 17 12 22l9-5" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-heading text-lg font-black tracking-tight">Netsurf Admin</p>
            <p className="text-[11px] tracking-[0.22em] text-white/45 uppercase">
              Park Operations Console
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/6 p-4">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/45 uppercase">
            Shift Focus
          </p>
          <p className="mt-2 text-sm font-semibold text-white/90">
            One control room for reservations, in-park sales, and stock movement.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/70">
              {nowLabel}
            </span>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-3 py-1 text-[11px] font-semibold text-amber-100">
              Premium lodge workflow
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/pos"
            onClick={onNavigate}
            className="rounded-[1.1rem] border border-white/0 bg-white px-3 py-3 text-center text-sm font-bold text-[#17300d] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-amber-50"
          >
            Open POS
          </Link>
          <Link
            to="/products/new"
            onClick={onNavigate}
            className="rounded-[1.1rem] border border-white/10 bg-white/8 px-3 py-3 text-center text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/12"
          >
            Add Product
          </Link>
        </div>
      </div>

      <nav className="admin-scrollbar flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.title} className={sectionIndex === 0 ? "" : "mt-6"}>
            <div className="px-3 pb-2">
              <p className="text-[11px] font-bold tracking-[0.22em] text-white/36 uppercase">
                {section.title}
              </p>
              <p className="mt-1 text-xs text-white/42">{section.blurb}</p>
            </div>

            <div className="space-y-1">
              {section.items.map((item, index) => {
                const active = isActivePath(pathname, item.to);

                return (
                  <motion.div
                    key={item.to}
                    initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                    animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                    transition={
                      reduceMotion
                        ? undefined
                        : { delay: sectionIndex * 0.05 + index * 0.03, duration: 0.28 }
                    }
                  >
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-start gap-3 rounded-[1.2rem] px-3 py-3 transition-[background-color,color,box-shadow,transform]",
                        active
                          ? "bg-white text-[#18340e] shadow-[0_12px_24px_rgb(6_14_3_/18%)]"
                          : "text-white/62 hover:bg-white/8 hover:text-white"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          active
                            ? "border-[#dfe9d8] bg-[#eef5e8] text-primary"
                            : "border-white/10 bg-white/6 text-white/70 group-hover:border-white/18 group-hover:bg-white/10"
                        )}
                      >
                        {item.icon}
                      </span>

                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{item.label}</span>
                        <span
                          className={cn(
                            "mt-1 block text-xs leading-5",
                            active ? "text-[#48633a]" : "text-white/42"
                          )}
                        >
                          {item.description}
                        </span>
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-3 rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
          <p className="text-xs font-semibold text-white/75">Workspace status</p>
          <p className="mt-1 text-xs leading-5 text-white/46">
            Reservations, POS, catalog, inventory, transfers, and sales are all available from this panel.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[1.1rem] border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white/70 transition-[background-color,color,transform] hover:bg-white/8 hover:text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="m16 17 5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const activeLabel =
    Object.entries(routeTitles).find(([path]) =>
      isActivePath(location.pathname, path as NavItem["to"])
    )?.[1] ?? "Admin";

  function handleLogout() {
    logout();
    setMobileOpen(false);
    navigate({ to: "/login" });
  }

  return (
    <>
      <div className="mb-4 lg:hidden">
        <div className="admin-surface rounded-[1.8rem] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="admin-kicker">Netsurf Admin</p>
              <p className="mt-1 truncate text-lg font-black tracking-tight text-foreground">
                {activeLabel}
              </p>
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Menu
            </button>
          </div>

          <div className="admin-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {mobilePrimaryItems.map((item) => {
              const active = isActivePath(location.pathname, item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow,transform]",
                    active
                      ? "admin-button-primary"
                      : "admin-button-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="hidden w-[320px] shrink-0 lg:block">
        <div className="sticky top-6 h-[calc(100vh-3rem)]">
          <SidebarBody pathname={location.pathname} onLogout={handleLogout} />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-[#071003]/46 p-4 backdrop-blur-sm lg:hidden"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          >
            <motion.div
              className="mx-auto flex h-full max-w-md flex-col"
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              transition={
                reduceMotion ? undefined : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <div className="mb-3 flex justify-end">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>

              <div className="min-h-0 flex-1">
                <SidebarBody
                  pathname={location.pathname}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
