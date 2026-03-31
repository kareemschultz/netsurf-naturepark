import { createFileRoute, Link } from "@tanstack/react-router";
import {
  adminRoleDefinitions,
  adminRoleMeta,
  adminRouteAccessRules,
  getDefaultAdminPath,
  hasAdminPermissions,
  type AdminPermissionResource,
  type AdminRoleDefinition,
  type AdminRoleSlug,
} from "@workspace/shared";
import {
  AdminPage,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";

export const Route = createFileRoute("/access")({
  component: AccessPage,
});

const resourceLabels: Record<AdminPermissionResource, string> = {
  user: "Staff users",
  session: "Sessions",
  dashboard: "Dashboard",
  bookings: "Bookings",
  calendar: "Calendar",
  blockedDates: "Blocked dates",
  pos: "POS",
  catalog: "Catalog",
  inventory: "Inventory",
  transfers: "Transfers",
  sales: "Sales",
  reports: "Reports",
  cabins: "Cabins",
};

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/bookings": "Bookings",
  "/calendar": "Calendar",
  "/blocked": "Blocked Dates",
  "/pos": "POS",
  "/products": "Products",
  "/inventory": "Inventory",
  "/stock-transfers": "Transfers",
  "/sales": "Sales",
  "/reports": "Reports",
  "/cabins": "Cabins",
  "/users": "Users",
  "/access": "Access",
};

const authEnhancements = [
  {
    title: "Two-factor logins",
    badge: "Recommended next",
    description:
      "Add a second factor for owner and manager accounts before opening broader staff access on the live system.",
  },
  {
    title: "Passkeys",
    badge: "Premium UX",
    description:
      "Faster, phishing-resistant sign-in for trusted staff devices without relying only on passwords.",
  },
  {
    title: "HIBP password checks",
    badge: "Security hygiene",
    description:
      "Block compromised passwords during account creation and resets to keep weak staff credentials out of the system.",
  },
  {
    title: "Captcha on auth endpoints",
    badge: "Abuse control",
    description:
      "Useful when the admin surface is more exposed or when credential stuffing needs another brake.",
  },
] as const;

const roleEntries = Object.entries(adminRoleDefinitions) as Array<
  [AdminRoleSlug, AdminRoleDefinition]
>;

function countPermissions(definition: AdminRoleDefinition) {
  return Object.values(definition).reduce(
    (count, actions) => count + (actions?.length ?? 0),
    0
  );
}

function getTopCapabilities(definition: AdminRoleDefinition) {
  return Object.entries(definition)
    .sort(([, left], [, right]) => (right?.length ?? 0) - (left?.length ?? 0))
    .slice(0, 4)
    .map(([resource]) => resourceLabels[resource as AdminPermissionResource]);
}

function AccessPage() {
  return (
    <AdminPage className="max-w-[1520px]">
      <PageHeader
        eyebrow="System"
        title="Roles, route gates, and session posture"
        description="The admin console now runs on Better Auth with named staff accounts, cookie-backed sessions, and route-level RBAC. This page is the operational map for who can get into what, what is already enforced, and which hardening layers still make sense next."
        meta={
          <>
            <InfoPill tone="green">Better Auth live</InfoPill>
            <InfoPill tone="green">RBAC enforced in routes</InfoPill>
            <InfoPill tone="amber">2FA and passkeys not enabled yet</InfoPill>
          </>
        }
        actions={
          <Link
            to="/users"
            className="admin-button-primary rounded-2xl px-4 py-3 text-sm font-bold"
          >
            Open Users & Access
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Auth Layer"
          value="Better Auth"
          note="Session cookies, user records, and server-side checks"
        />
        <MetricCard
          label="Defined Roles"
          value={String(roleEntries.length)}
          note="Owner, manager, front desk, POS, inventory, analyst"
          tone="amber"
        />
        <MetricCard
          label="Protected Routes"
          value={String(adminRouteAccessRules.length)}
          note="Menus and route redirects are trimmed by permission"
          tone="green"
        />
        <MetricCard
          label="Next Security Layers"
          value={String(authEnhancements.length)}
          note="Better Auth plugins worth considering next"
          tone="slate"
        />
      </div>

      <PageSection className="p-6 sm:p-7">
        <SectionTitle
          title="Role control matrix"
          description="Each role below is mapped to real route access and action permissions, not placeholder labels."
        />

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {roleEntries.map(([role, definition]) => {
            const meta = adminRoleMeta[role];
            const landingPath = getDefaultAdminPath(role);
            const accessibleRoutes = adminRouteAccessRules.filter((rule) =>
              hasAdminPermissions(role, rule.permissions)
            );

            return (
              <div
                key={role}
                className="rounded-[1.7rem] border border-primary/10 bg-white/74 p-5 shadow-[0_18px_40px_rgb(24_45_12_/7%)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="admin-kicker">Role</p>
                    <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">
                      {meta.label}
                    </h2>
                  </div>
                  <InfoPill tone={role === "owner" ? "green" : "neutral"}>
                    {countPermissions(definition)} permission checks
                  </InfoPill>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {meta.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {getTopCapabilities(definition).map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
                    >
                      {capability}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <AccessStat
                    label="Landing route"
                    value={routeLabels[landingPath] ?? landingPath}
                  />
                  <AccessStat
                    label="Visible modules"
                    value={String(accessibleRoutes.length)}
                  />
                </div>

                <div className="mt-5 border-t border-primary/8 pt-4">
                  <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    Route coverage
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {accessibleRoutes.map((rule) => (
                      <span
                        key={rule.path}
                        className="rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold text-foreground"
                      >
                        {routeLabels[rule.path] ?? rule.path}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Route-level gates"
            description="These are the menu and redirect checkpoints that currently decide whether a user can open a screen."
          />

          <div className="space-y-3">
            {adminRouteAccessRules.map((rule) => (
              <div
                key={rule.path}
                className="flex flex-col gap-3 rounded-[1.45rem] border border-primary/10 bg-white/76 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-bold text-foreground">
                    {routeLabels[rule.path] ?? rule.path}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {rule.path}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(rule.permissions).map(([resource, actions]) =>
                    (actions ?? []).map((action) => (
                      <span
                        key={`${rule.path}-${resource}-${action}`}
                        className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800"
                      >
                        {resourceLabels[resource as AdminPermissionResource]}: {action}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Better Auth enhancement runway"
            description="Useful plugins and controls that fit this admin system if you want to tighten security or smooth staff access next."
          />

          <div className="space-y-4">
            {authEnhancements.map((item, index) => (
              <div
                key={item.title}
                className="rounded-[1.55rem] border border-primary/10 bg-white/74 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="admin-kicker">Enhancement {index + 1}</p>
                    <p className="mt-2 text-lg font-black tracking-tight text-foreground">
                      {item.title}
                    </p>
                  </div>
                  <InfoPill tone={index === 0 ? "amber" : "neutral"}>
                    {item.badge}
                  </InfoPill>
                </div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </PageSection>
      </div>
    </AdminPage>
  );
}

function AccessStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-primary/10 bg-primary/4 px-4 py-3">
      <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
