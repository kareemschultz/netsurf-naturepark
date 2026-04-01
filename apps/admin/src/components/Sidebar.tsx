import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { logout } from "@/lib/api";
import {
  canSessionAccess,
  getSessionRoleLabel,
  normalizeAdminPathname,
  useAdminSession,
} from "@/lib/auth";
import { cn } from "@workspace/ui/lib/utils";

type NavItem = {
  to:
    | "/"
    | "/bookings"
    | "/calendar"
    | "/blocked"
    | "/pos"
    | "/products"
    | "/inventory"
    | "/stock-transfers"
    | "/sales"
    | "/reports"
    | "/cabins"
    | "/users"
    | "/access";
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
];

const mobilePrimaryItems = [reservationItems[0], reservationItems[1], operationsItems[0], operationsItems[2], operationsItems[4]];

const systemItems: NavItem[] = [
  {
    to: "/users",
    label: "Users",
    description: "Staff accounts, sessions, and role assignment",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: "/access",
    label: "Access",
    description: "Role matrix and route-level access control",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

const navSections = [
  {
    title: "Reservations",
    blurb: "Bookings, cabin board, and schedule",
    items: reservationItems,
  },
  {
    title: "Operations",
    blurb: "POS, catalog, stock, and revenue",
    items: operationsItems,
  },
  {
    title: "System",
    blurb: "Staff accounts, sessions, and permissions",
    items: systemItems,
  },
] as const;

const routeTitles = [...reservationItems, ...operationsItems, ...systemItems].reduce<Record<string, string>>(
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
  accessiblePaths,
  profileLabel,
  roleLabel,
}: {
  pathname: string;
  onNavigate?: () => void;
  onLogout: () => void;
  accessiblePaths: Set<string>;
  profileLabel: string;
  roleLabel: string;
}) {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const [atBottom, setAtBottom] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleNavScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 8);
  }, []);

  useEffect(() => {
    handleNavScroll();
  }, [handleNavScroll]);

  const nowLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    []
  );
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => accessiblePaths.has(item.to)),
    }))
    .filter((section) => section.items.length > 0);
  const canOpenPos = accessiblePaths.has("/pos");
  const canManageCatalog = accessiblePaths.has("/products");

  return (
    <div className="admin-surface admin-surface-dark flex h-full flex-col rounded-[2rem] text-white">
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
              {roleLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {canOpenPos ? (
            <Link
              to="/pos"
              onClick={onNavigate}
              className="rounded-[1.1rem] border border-white/0 bg-white px-3 py-3 text-center text-sm font-bold text-[#17300d] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-amber-50"
            >
              Open POS
            </Link>
          ) : (
            <div className="rounded-[1.1rem] border border-white/10 bg-white/4 px-3 py-3 text-center text-sm font-bold text-white/45">
              POS locked
            </div>
          )}
          {canManageCatalog ? (
            <Link
              to="/products/new"
              onClick={onNavigate}
              className="rounded-[1.1rem] border border-white/10 bg-white/8 px-3 py-3 text-center text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-white/12"
            >
              Add Product
            </Link>
          ) : (
            <div className="rounded-[1.1rem] border border-white/10 bg-white/4 px-3 py-3 text-center text-sm font-bold text-white/45">
              Catalog locked
            </div>
          )}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <nav ref={navRef} className="admin-scrollbar admin-scrollbar-dark h-full overflow-y-auto px-3 py-4" onScroll={handleNavScroll}>
          {visibleSections.map((section, sectionIndex) => (
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
        <div className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-[2rem] bg-gradient-to-t from-[#0b1e07] to-transparent transition-opacity duration-200",
          atBottom ? "opacity-0" : "opacity-100"
        )} />
      </div>

      <div className="border-t border-white/10 px-3 py-3">
        <div className="mb-3 rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3">
          <p className="text-xs font-semibold text-white/75">{profileLabel}</p>
          <p className="mt-1 text-xs leading-5 text-white/46">{roleLabel}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[1.1rem] border border-white/10 bg-white/4 text-white/70 transition-[background-color,color,transform] hover:bg-white/8 hover:text-white"
          >
            {theme === "dark" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>
          <button
            onClick={onLogout}
            className="flex flex-1 items-center justify-center gap-2 rounded-[1.1rem] border border-white/10 bg-white/4 px-4 py-3 text-sm font-semibold text-white/70 transition-[background-color,color,transform] hover:bg-white/8 hover:text-white"
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
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const sessionState = useAdminSession();
  const session = sessionState.data;
  const adminPathname = normalizeAdminPathname(location.pathname);
  const accessiblePaths = useMemo(
    () =>
      new Set(
        [...reservationItems, ...operationsItems, ...systemItems]
          .map((item) => item.to)
          .filter((path) => canSessionAccess(path, session))
      ),
    [session]
  );
  const mobileVisibleItems = useMemo(() => {
    const visiblePrimaryItems = mobilePrimaryItems.filter((item) =>
      accessiblePaths.has(item.to)
    );
    const activeItem = [...reservationItems, ...operationsItems, ...systemItems].find(
      (item) => isActivePath(adminPathname, item.to)
    );

    if (
      activeItem &&
      accessiblePaths.has(activeItem.to) &&
      !visiblePrimaryItems.some((item) => item.to === activeItem.to)
    ) {
      return [...visiblePrimaryItems, activeItem];
    }

    return visiblePrimaryItems;
  }, [accessiblePaths, adminPathname]);
  const profileLabel = session
    ? session.user.displayUsername || session.user.name || session.user.username || session.user.email
    : "Staff session";
  const roleLabel = getSessionRoleLabel(session);

  const activeLabel =
    Object.entries(routeTitles).find(([path]) =>
      isActivePath(adminPathname, path as NavItem["to"])
    )?.[1] ?? "Admin";

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  async function handleLogout() {
    await logout();
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
              aria-label="Open navigation menu"
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
            >
              Menu
            </button>
          </div>

          <div className="admin-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {mobileVisibleItems.map((item) => {
              const active = isActivePath(adminPathname, item.to);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
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
            <SidebarBody
            pathname={adminPathname}
            onLogout={handleLogout}
            accessiblePaths={accessiblePaths}
            profileLabel={profileLabel}
            roleLabel={roleLabel}
          />
        </div>
      </aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            className="fixed inset-0 z-50 bg-[#071003]/46 p-4 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
          >
            <motion.div
              className="mx-auto flex h-full max-w-md flex-col"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              onClick={(e) => e.stopPropagation()}
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
                  aria-label="Close navigation menu"
                  className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>

              <div className="min-h-0 flex-1">
                <SidebarBody
                  pathname={adminPathname}
                  onNavigate={() => setMobileOpen(false)}
                  onLogout={handleLogout}
                  accessiblePaths={accessiblePaths}
                  profileLabel={profileLabel}
                  roleLabel={roleLabel}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
