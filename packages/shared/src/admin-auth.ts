export const adminPermissionStatements = {
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
  dashboard: ["view"],
  bookings: ["view", "manage"],
  calendar: ["view"],
  blockedDates: ["view", "manage"],
  pos: ["view", "checkout"],
  catalog: ["view", "manage"],
  inventory: ["view", "manage"],
  transfers: ["view", "manage"],
  sales: ["view", "void", "export"],
  reports: ["view", "export"],
  cabins: ["view"],
} as const;

export type AdminPermissionResource = keyof typeof adminPermissionStatements;
export type AdminRoleSlug =
  | "owner"
  | "manager"
  | "front_desk"
  | "pos_operator"
  | "inventory_manager"
  | "analyst";

type PermissionArray<Resource extends AdminPermissionResource> =
  typeof adminPermissionStatements[Resource];

type PermissionAction<Resource extends AdminPermissionResource> =
  PermissionArray<Resource>[number];

export type AdminPermissionRequest = {
  [Resource in AdminPermissionResource]?: readonly PermissionAction<Resource>[];
};

export type AdminRoleDefinition = {
  [Resource in AdminPermissionResource]?: readonly PermissionAction<Resource>[];
};

export const adminRoleDefinitions: Record<AdminRoleSlug, AdminRoleDefinition> = {
  owner: {
    user: adminPermissionStatements.user,
    session: adminPermissionStatements.session,
    dashboard: adminPermissionStatements.dashboard,
    bookings: adminPermissionStatements.bookings,
    calendar: adminPermissionStatements.calendar,
    blockedDates: adminPermissionStatements.blockedDates,
    pos: adminPermissionStatements.pos,
    catalog: adminPermissionStatements.catalog,
    inventory: adminPermissionStatements.inventory,
    transfers: adminPermissionStatements.transfers,
    sales: adminPermissionStatements.sales,
    reports: adminPermissionStatements.reports,
    cabins: adminPermissionStatements.cabins,
  },
  manager: {
    user: ["list", "get"],
    session: ["list", "revoke"],
    dashboard: ["view"],
    bookings: ["view", "manage"],
    calendar: ["view"],
    blockedDates: ["view", "manage"],
    pos: ["view", "checkout"],
    catalog: ["view", "manage"],
    inventory: ["view", "manage"],
    transfers: ["view", "manage"],
    sales: ["view", "void", "export"],
    reports: ["view", "export"],
    cabins: ["view"],
  },
  front_desk: {
    dashboard: ["view"],
    bookings: ["view", "manage"],
    calendar: ["view"],
    blockedDates: ["view"],
    pos: ["view", "checkout"],
    sales: ["view"],
    cabins: ["view"],
  },
  pos_operator: {
    dashboard: ["view"],
    pos: ["view", "checkout"],
    sales: ["view"],
  },
  inventory_manager: {
    dashboard: ["view"],
    catalog: ["view", "manage"],
    inventory: ["view", "manage"],
    transfers: ["view", "manage"],
    sales: ["view", "export"],
    reports: ["view", "export"],
    cabins: ["view"],
  },
  analyst: {
    dashboard: ["view"],
    bookings: ["view"],
    calendar: ["view"],
    blockedDates: ["view"],
    sales: ["view", "export"],
    reports: ["view", "export"],
    cabins: ["view"],
  },
};

export const adminRoleMeta: Record<
  AdminRoleSlug,
  { label: string; description: string }
> = {
  owner: {
    label: "Owner",
    description: "Full control over staff, reservations, POS, stock, and reporting.",
  },
  manager: {
    label: "Manager",
    description: "Runs operations day to day with visibility into staff sessions.",
  },
  front_desk: {
    label: "Front Desk",
    description: "Handles reservations, guest changes, and walk-in checkout.",
  },
  pos_operator: {
    label: "POS Operator",
    description: "Focused checkout access for sales and cashier workflows.",
  },
  inventory_manager: {
    label: "Inventory Manager",
    description: "Owns catalog, stock health, transfers, and export views.",
  },
  analyst: {
    label: "Analyst",
    description: "Read-only operations visibility for revenue and occupancy review.",
  },
};

export const defaultAdminRole: AdminRoleSlug = "front_desk";
export const adminRolesWithElevatedManagement: readonly AdminRoleSlug[] = [
  "owner",
  "manager",
];

type RouteAccessRule = {
  path: string;
  permissions: AdminPermissionRequest;
};

export const adminRouteAccessRules: readonly RouteAccessRule[] = [
  { path: "/", permissions: { dashboard: ["view"] } },
  { path: "/bookings", permissions: { bookings: ["view"] } },
  { path: "/calendar", permissions: { calendar: ["view"] } },
  { path: "/blocked", permissions: { blockedDates: ["view"] } },
  { path: "/pos", permissions: { pos: ["view"] } },
  { path: "/products", permissions: { catalog: ["view"] } },
  { path: "/inventory", permissions: { inventory: ["view"] } },
  { path: "/stock-transfers", permissions: { transfers: ["view"] } },
  { path: "/sales", permissions: { sales: ["view"] } },
  { path: "/reports", permissions: { reports: ["view"] } },
  { path: "/cabins", permissions: { cabins: ["view"] } },
  { path: "/users", permissions: { user: ["list"] } },
  { path: "/access", permissions: { user: ["list"] } },
];

export const preferredAdminLandingPages: readonly string[] = [
  "/",
  "/bookings",
  "/pos",
  "/inventory",
  "/reports",
  "/cabins",
];

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function parseAdminRoles(roleValue?: string | null): AdminRoleSlug[] {
  if (!roleValue) return [];

  const parsed = roleValue
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is AdminRoleSlug => value in adminRoleDefinitions);

  return parsed.length > 0 ? parsed : [];
}

export function getAdminRoleLabels(
  roleValue: string | null | undefined
): string[] {
  return parseAdminRoles(roleValue).map((role) => adminRoleMeta[role].label);
}

export function roleHasAdminPermissions(
  role: AdminRoleSlug,
  requiredPermissions: AdminPermissionRequest
): boolean {
  const grantedPermissions = adminRoleDefinitions[role];

  return Object.entries(requiredPermissions).every(([resource, actions]) => {
    if (!actions || actions.length === 0) return true;

    const grantedActions =
      grantedPermissions[resource as AdminPermissionResource] ?? [];

    return actions.every((action) =>
      (grantedActions as readonly string[]).includes(action)
    );
  });
}

export function hasAdminPermissions(
  roleValue: string | null | undefined,
  requiredPermissions: AdminPermissionRequest
): boolean {
  return parseAdminRoles(roleValue).some((role) =>
    roleHasAdminPermissions(role, requiredPermissions)
  );
}

export function canAccessAdminPath(
  pathname: string,
  roleValue: string | null | undefined
): boolean {
  const normalizedPath = normalizePathname(pathname);

  if (normalizedPath === "/login") return true;

  const matchedRule = adminRouteAccessRules.find((rule) => {
    if (rule.path === "/") {
      return normalizedPath === "/";
    }
    return normalizedPath === rule.path || normalizedPath.startsWith(`${rule.path}/`);
  });

  if (!matchedRule) return true;
  return hasAdminPermissions(roleValue, matchedRule.permissions);
}

export function getDefaultAdminPath(roleValue: string | null | undefined): string {
  for (const path of preferredAdminLandingPages) {
    if (canAccessAdminPath(path, roleValue)) {
      return path;
    }
  }

  return "/";
}
