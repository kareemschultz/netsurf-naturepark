import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  adminPermissionStatements,
  adminRoleDefinitions,
  canAccessAdminPath,
  getDefaultAdminPath,
  getAdminRoleLabels,
  hasAdminPermissions,
  type AdminPermissionRequest,
  type AdminRoleSlug,
} from "@workspace/shared";

export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : "/api";

const authAccessControl = createAccessControl(adminPermissionStatements);
type BetterAuthRoleDefinition = Parameters<typeof authAccessControl.newRole>[0];
const authRoles = Object.fromEntries(
  Object.entries(adminRoleDefinitions).map(([role, definition]) => [
    role,
    authAccessControl.newRole(definition as BetterAuthRoleDefinition),
  ])
) as Record<AdminRoleSlug, ReturnType<typeof authAccessControl.newRole>>;

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/auth`,
  fetchOptions: {
    credentials: "include",
  },
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchWhenOffline: false,
  },
  plugins: [
    adminClient({
      ac: authAccessControl,
      roles: authRoles,
    }),
    usernameClient(),
  ],
});

export type AdminSession = typeof authClient.$Infer.Session;
export const useAdminSession = authClient.useSession;

export async function fetchAdminSession(): Promise<AdminSession | null> {
  const result = await authClient.getSession();
  return result.data ?? null;
}

export async function signInWithUsername(
  username: string,
  password: string
): Promise<void> {
  const result = await authClient.signIn.username({
    username,
    password,
  });

  if (result.error) {
    throw new Error(result.error.message || "Unable to sign in");
  }
}

export async function signOutAdmin(): Promise<void> {
  await authClient.signOut();
}

export function canSessionAccess(
  pathname: string,
  session: AdminSession | null | undefined
): boolean {
  return canAccessAdminPath(pathname, session?.user.role ?? null);
}

export function getSessionLandingPath(
  session: AdminSession | null | undefined
): string {
  return getDefaultAdminPath(session?.user.role ?? null);
}

export function getSessionRoleLabel(
  session: AdminSession | null | undefined
): string {
  const labels = getAdminRoleLabels(session?.user.role ?? null);
  return labels.length > 0 ? labels.join(" · ") : "Role pending";
}

export function hasSessionPermissions(
  session: AdminSession | null | undefined,
  permissions: AdminPermissionRequest
): boolean {
  return hasAdminPermissions(session?.user.role ?? null, permissions);
}
