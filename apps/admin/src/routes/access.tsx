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
  MetricCard,
  PageHeader,
  PageSection,
  SectionTitle,
} from "@/components/AdminUI";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

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
            <Badge variant="secondary">Better Auth live</Badge>
            <Badge variant="secondary">RBAC enforced in routes</Badge>
            <Badge variant="outline">2FA and passkeys not enabled yet</Badge>
          </>
        }
        actions={
          <Link to="/users">
            <Button>Open Users & Access</Button>
          </Link>
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {roleEntries.map(([role, definition]) => {
            const meta = adminRoleMeta[role];
            const landingPath = getDefaultAdminPath(role);
            const accessibleRoutes = adminRouteAccessRules.filter((rule) =>
              hasAdminPermissions(role, rule.permissions)
            );

            return (
              <Card key={role}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Role
                      </p>
                      <CardTitle className="mt-2 text-xl">{meta.label}</CardTitle>
                    </div>
                    <Badge variant={role === "owner" ? "secondary" : "outline"}>
                      {countPermissions(definition)} permission checks
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {meta.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {getTopCapabilities(definition).map((capability) => (
                      <Badge key={capability} variant="outline">
                        {capability}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <AccessStat
                      label="Landing route"
                      value={routeLabels[landingPath] ?? landingPath}
                    />
                    <AccessStat
                      label="Visible modules"
                      value={String(accessibleRoutes.length)}
                    />
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                      Route coverage
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {accessibleRoutes.map((rule) => (
                        <Badge key={rule.path} variant="outline">
                          {routeLabels[rule.path] ?? rule.path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </PageSection>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <PageSection className="min-w-0 p-6 sm:p-7">
          <SectionTitle
            title="Route-level gates"
            description="These are the menu and redirect checkpoints that currently decide whether a user can open a screen."
          />

          <div className="space-y-3">
            {adminRouteAccessRules.map((rule) => (
              <div
                key={rule.path}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
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
                      <Badge
                        key={`${rule.path}-${resource}-${action}`}
                        variant="outline"
                        className="border-amber-200/80 bg-amber-50 text-amber-800"
                      >
                        {resourceLabels[resource as AdminPermissionResource]}: {action}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </PageSection>

        <PageSection className="min-w-0 p-6 sm:p-7">
          <SectionTitle
            title="Better Auth enhancement runway"
            description="Useful plugins and controls that fit this admin system if you want to tighten security or smooth staff access next."
          />

          <div className="space-y-5">
            {authEnhancements.map((item, index) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Enhancement {index + 1}
                    </p>
                    <p className="mt-2 text-lg font-black tracking-tight text-foreground">
                      {item.title}
                    </p>
                  </div>
                  <Badge variant={index === 0 ? "outline" : "secondary"}>
                    {item.badge}
                  </Badge>
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
    <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
      <p className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-bold text-foreground">{value}</p>
    </div>
  );
}
