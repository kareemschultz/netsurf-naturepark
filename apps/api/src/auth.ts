import type { Context, MiddlewareHandler, Next } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, username } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminPermissionStatements,
  adminRoleDefinitions,
  adminRolesWithElevatedManagement,
  defaultAdminRole,
  hasAdminPermissions,
  type AdminPermissionRequest,
  type AdminRoleSlug,
} from "@workspace/shared";
import {
  authAccounts,
  authSessions,
  authUsers,
  authVerifications,
} from "@workspace/db";
import { db } from "./db.js";

const authAccessControl = createAccessControl(adminPermissionStatements);
type BetterAuthRoleDefinition = Parameters<typeof authAccessControl.newRole>[0];
const authRoles = Object.fromEntries(
  Object.entries(adminRoleDefinitions).map(([role, definition]) => [
    role,
    authAccessControl.newRole(definition as BetterAuthRoleDefinition),
  ])
) as Record<
  AdminRoleSlug,
  ReturnType<typeof authAccessControl.newRole>
>;

function splitOrigins(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildTrustedOrigins(): string[] {
  const origins = new Set<string>();

  for (const origin of splitOrigins(process.env.ALLOWED_ORIGINS)) {
    origins.add(origin);
  }

  for (const origin of splitOrigins(process.env.BETTER_AUTH_TRUSTED_ORIGINS)) {
    origins.add(origin);
  }

  const betterAuthUrl = process.env.BETTER_AUTH_URL?.trim();
  if (betterAuthUrl) {
    origins.add(new URL(betterAuthUrl).origin);
  }

  return Array.from(origins);
}

function resolveBetterAuthBaseUrl(): string | undefined {
  const configuredUrl = process.env.BETTER_AUTH_URL?.trim();
  if (!configuredUrl) return undefined;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return configuredUrl;
  }
}

export const auth = betterAuth({
  basePath: "/auth",
  baseURL: resolveBetterAuthBaseUrl(),
  trustedOrigins: buildTrustedOrigins(),
  advanced: {
    trustedProxyHeaders: true,
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 40,
    }),
    admin({
      ac: authAccessControl,
      roles: authRoles,
      defaultRole: defaultAdminRole,
      adminRoles: Array.from(adminRolesWithElevatedManagement),
    }),
  ],
});

type SessionRecord = Awaited<ReturnType<typeof auth.api.getSession>>;

function getSessionRoleValue(session: SessionRecord | null | undefined): string | null {
  const role = session?.user.role;
  return typeof role === "string" && role.length > 0 ? role : null;
}

export async function getAdminSession(c: Context): Promise<SessionRecord | null> {
  return auth.api.getSession({
    headers: c.req.raw.headers,
  });
}

export function getAdminSubject(c: Context): string {
  const session = c.get("adminSession") as SessionRecord | undefined;
  if (!session) return "unknown";

  return (
    session.user.displayUsername ||
    session.user.username ||
    session.user.email ||
    session.user.id
  );
}

export function getAdminRoleValue(c: Context): string | null {
  const session = c.get("adminSession") as SessionRecord | undefined;
  return getSessionRoleValue(session);
}

export function authorizeAdminRequest(
  c: Context,
  requiredPermissions: AdminPermissionRequest
): Response | null {
  const roleValue = getAdminRoleValue(c);

  if (!hasAdminPermissions(roleValue, requiredPermissions)) {
    return c.json({ error: "Forbidden" }, 403);
  }

  return null;
}

export function adminMiddleware(
  requiredPermissions?: AdminPermissionRequest
): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const session = await getAdminSession(c);

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const roleValue = getSessionRoleValue(session);
    if (
      requiredPermissions &&
      !hasAdminPermissions(roleValue, requiredPermissions)
    ) {
      return c.json({ error: "Forbidden" }, 403);
    }

    c.set("adminSession", session);
    c.set("adminSubject", getAdminSubjectFromSession(session));
    await next();
  };
}

function getAdminSubjectFromSession(session: NonNullable<SessionRecord>): string {
  return (
    session.user.displayUsername ||
    session.user.username ||
    session.user.email ||
    session.user.id
  );
}

function getBootstrapCredentials() {
  const password =
    process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim() ||
    process.env.ADMIN_PASSWORD?.trim();

  if (!password) return null;

  const email =
    process.env.ADMIN_EMAIL?.trim().toLowerCase() ||
    "admin@netsurfnaturepark.com";
  const username =
    process.env.ADMIN_USERNAME?.trim().toLowerCase() ||
    email.split("@")[0] ||
    "admin";
  const name = process.env.ADMIN_NAME?.trim() || "Netsurf Owner";

  return {
    email,
    password,
    username,
    name,
  };
}

export async function ensureAuthBootstrap(): Promise<void> {
  const [existingSessionUser] = await db.select({ id: authUsers.id }).from(authUsers).limit(1);

  if (existingSessionUser) {
    return;
  }

  const bootstrap = getBootstrapCredentials();
  if (!bootstrap) {
    console.warn(
      "[auth] No bootstrap password configured. Set ADMIN_PASSWORD or ADMIN_BOOTSTRAP_PASSWORD before first launch."
    );
    return;
  }

  await auth.api.createUser({
    body: {
      email: bootstrap.email,
      password: bootstrap.password,
      name: bootstrap.name,
      role: "owner",
      data: {
        username: bootstrap.username,
        displayUsername: bootstrap.name,
      },
    },
  });

  console.log(
    `[auth] Bootstrapped owner account ${bootstrap.username} (${bootstrap.email})`
  );
}
