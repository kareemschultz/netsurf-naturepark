import { useMemo, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";
import {
  canSessionAccess,
  getSessionRoleLabel,
  normalizeAdminPathname,
  useAdminSession,
  signOutAdmin,
} from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";

// ─── Nav structure types ──────────────────────────────────────────────────────

type NavLink = {
  title: string;
  url: string;
  icon: ReactNode;
  badge?: string;
};

type NavGroup = {
  title: string;
  items: NavLink[];
};

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconDashboard = () => (
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
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const IconBookings = () => (
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
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
    <path d="M14 3v5h5" />
    <path d="M9 13h6" />
    <path d="M9 17h4" />
  </svg>
);

const IconCalendar = () => (
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
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h18" />
  </svg>
);

const IconCabins = () => (
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
    <path d="M3 11 12 4l9 7" />
    <path d="M5 10v10h14V10" />
    <path d="M9 20v-6h6v6" />
  </svg>
);

const IconBlocked = () => (
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
    <circle cx="12" cy="12" r="9" />
    <path d="m7 7 10 10" />
  </svg>
);

const IconPos = () => (
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
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M6 9h12" />
    <path d="M7 13h4" />
  </svg>
);

const IconProducts = () => (
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
    <path d="M21 8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

const IconInventory = () => (
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
    <path d="M3 7.5 12 3l9 4.5-9 4.5-9-4.5Z" />
    <path d="M3 12 12 16.5 21 12" />
    <path d="M3 16.5 12 21l9-4.5" />
  </svg>
);

const IconTransfers = () => (
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
    <path d="M5 9h11" />
    <path d="m12 5 4 4-4 4" />
    <path d="M19 15H8" />
    <path d="m12 11-4 4 4 4" />
  </svg>
);

const IconSales = () => (
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
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 3 3 5-7" />
  </svg>
);

const IconReports = () => (
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
    <path d="M3 3v18h18" />
    <path d="M7 15V9" />
    <path d="M12 15V6" />
    <path d="M17 15v-3" />
  </svg>
);

const IconUsers = () => (
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
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconAccess = () => (
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
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconChevronRight = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const IconChevronsUpDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

const IconLogOut = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const IconLeaf = () => (
  <svg
    width="18"
    height="18"
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
);

// ─── Additional icons ─────────────────────────────────────────────────────────

const IconGallery = () => (
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
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

// ─── Nav data ────────────────────────────────────────────────────────────────

const allNavGroups: NavGroup[] = [
  {
    title: "",
    items: [
      { title: "Dashboard", url: "/", icon: <IconDashboard /> },
    ],
  },
  {
    title: "Reservations",
    items: [
      { title: "All Bookings", url: "/bookings", icon: <IconBookings /> },
      { title: "Cabin Calendar", url: "/calendar", icon: <IconCalendar /> },
      { title: "Cabin Availability", url: "/cabins", icon: <IconCabins /> },
      { title: "Blocked Dates", url: "/blocked", icon: <IconBlocked /> },
    ],
  },
  {
    title: "Point of Sale",
    items: [
      { title: "POS Terminal", url: "/pos", icon: <IconPos /> },
      { title: "Products & Categories", url: "/products", icon: <IconProducts /> },
      { title: "Inventory", url: "/inventory", icon: <IconInventory /> },
      { title: "Stock Transfers", url: "/stock-transfers", icon: <IconTransfers /> },
    ],
  },
  {
    title: "Finance",
    items: [
      { title: "Sales Ledger", url: "/sales", icon: <IconSales /> },
      { title: "Reports & Analytics", url: "/reports", icon: <IconReports /> },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Gallery Manager", url: "/gallery", icon: <IconGallery /> },
    ],
  },
  {
    title: "Administration",
    items: [
      { title: "Staff & Users", url: "/users", icon: <IconUsers /> },
      { title: "Access & Roles", url: "/access", icon: <IconAccess /> },
    ],
  },
];

// ─── Active path helper ───────────────────────────────────────────────────────

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

// ─── NavGroup component ───────────────────────────────────────────────────────

function AppNavGroup({
  group,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarGroup>
      {group.title ? (
        <SidebarGroupLabel className="text-[10px] font-bold tracking-[0.2em] uppercase text-sidebar-foreground/40">
          {group.title}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu>
        {group.items.map((item) => {
          const active = isActivePath(pathname, item.url);
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={item.title}
                className={cn(
                  "transition-[background-color,color,box-shadow] duration-150",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[inset_3px_0_0_rgb(255_255_255_/40%)] hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Link
                  to={item.url as "/"}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpenMobile(false)}
                >
                  {item.icon}
                  <span>{item.title}</span>
                  {item.badge && (
                    <span className="ms-auto rounded-full bg-sidebar-primary/15 px-1.5 py-0.5 text-xs font-medium text-sidebar-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

// ─── NavUser component ────────────────────────────────────────────────────────

function NavUser({
  name,
  roleLabel,
  onSignOut,
}: {
  name: string;
  roleLabel: string;
  onSignOut: () => void;
}) {
  const { isMobile } = useSidebar();
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenuPrimitive.Root>
          <DropdownMenuPrimitive.Trigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Avatar */}
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {roleLabel}
                </span>
              </div>
              <span className="ms-auto text-sidebar-foreground/40">
                <IconChevronsUpDown />
              </span>
            </SidebarMenuButton>
          </DropdownMenuPrimitive.Trigger>
          <DropdownMenuPrimitive.Content
            className={cn(
              "z-50 min-w-56 overflow-hidden rounded-lg border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            {/* Profile header */}
            <div className="flex items-center gap-2 px-2 py-2 text-sm">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
                {initials}
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  {roleLabel}
                </span>
              </div>
            </div>
            <DropdownMenuPrimitive.Separator className="mx-1 my-1 h-px bg-sidebar-border" />
            <DropdownMenuPrimitive.Item
              onSelect={onSignOut}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive outline-none transition-colors",
                "hover:bg-sidebar-accent focus:bg-sidebar-accent"
              )}
            >
              <IconLogOut />
              Sign out
            </DropdownMenuPrimitive.Item>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Root>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const sessionState = useAdminSession();
  const session = sessionState.data;

  const pathname = normalizeAdminPathname(location.pathname);

  const visibleGroups = useMemo(() => {
    return allNavGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          canSessionAccess(item.url, session)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [session]);

  const displayName = session
    ? session.user.name ||
      (session.user as { username?: string }).username ||
      session.user.email
    : "Staff";

  const roleLabel = getSessionRoleLabel(session);

  async function handleSignOut() {
    await signOutAdmin();
    navigate({ to: "/login" });
  }

  return (
    <Sidebar collapsible="icon">
      {/* Header — brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Netsurf Nature Park">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <IconLeaf />
              </div>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-bold text-sidebar-foreground">
                  Netsurf Admin
                </span>
                <span className="truncate text-xs text-sidebar-foreground/55 uppercase tracking-wide">
                  Park Operations
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        {visibleGroups.map((group) => (
          <AppNavGroup key={group.title} group={group} pathname={pathname} />
        ))}
      </SidebarContent>

      {/* Footer — user */}
      <SidebarFooter>
        <NavUser
          name={displayName}
          roleLabel={roleLabel}
          onSignOut={handleSignOut}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
