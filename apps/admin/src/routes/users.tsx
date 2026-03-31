import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  banStaffUser,
  createStaffUser,
  listStaffUsers,
  listStaffUserSessions,
  removeStaffUser,
  revokeAllStaffUserSessions,
  revokeStaffUserSession,
  setStaffUserPassword,
  setStaffUserRole,
  unbanStaffUser,
  updateStaffUser,
  type AdminUserRecord,
  type AdminUserSessionRecord,
} from "@/lib/api";
import {
  getSessionRoleLabel,
  hasSessionPermissions,
  useAdminSession,
} from "@/lib/auth";
import {
  AdminPage,
  EmptyState,
  FilterChip,
  InfoPill,
  MetricCard,
  PageHeader,
  PageSection,
  SearchField,
  SectionTitle,
} from "@/components/AdminUI";
import {
  adminRoleMeta,
  defaultAdminRole,
  type AdminRoleSlug,
} from "@workspace/shared";
import { cn } from "@workspace/ui/lib/utils";

export const Route = createFileRoute("/users")({
  component: UsersPage,
});

type StaffRoleFilter = AdminRoleSlug | "all";
type NoticeTone = "green" | "amber" | "red";

type Notice = {
  tone: NoticeTone;
  message: string;
};

type CreateUserDraft = {
  name: string;
  email: string;
  username: string;
  password: string;
  role: AdminRoleSlug;
};

type ProfileDraft = {
  name: string;
  email: string;
  username: string;
  role: AdminRoleSlug;
};

const emptyCreateUserDraft: CreateUserDraft = {
  name: "",
  email: "",
  username: "",
  password: "",
  role: defaultAdminRole,
};

const roleOptions = Object.entries(adminRoleMeta) as Array<
  [AdminRoleSlug, (typeof adminRoleMeta)[AdminRoleSlug]]
>;

function isAdminRoleSlug(value: string | null | undefined): value is AdminRoleSlug {
  return Boolean(value && value in adminRoleMeta);
}

function toRoleSlug(value: string | null | undefined): AdminRoleSlug {
  return isAdminRoleSlug(value) ? value : defaultAdminRole;
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not set";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  return format(date, "d MMM yyyy, h:mm a");
}

function getInitials(user: Pick<AdminUserRecord, "name" | "email">) {
  const source = user.name.trim() || user.email.trim();
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function UsersPage() {
  const sessionState = useAdminSession();
  const session = sessionState.data;
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<AdminUserSessionRecord[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [roleFilter, setRoleFilter] = useState<StaffRoleFilter>("all");
  const [createDraft, setCreateDraft] = useState<CreateUserDraft>(emptyCreateUserDraft);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    name: "",
    email: "",
    username: "",
    role: defaultAdminRole,
  });
  const [passwordDraft, setPasswordDraft] = useState("");
  const [banReason, setBanReason] = useState("Access removed");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [resultTotal, setResultTotal] = useState(0);
  const [isTransitionPending, startUiTransition] = useTransition();

  const canCreateUsers = hasSessionPermissions(session, { user: ["create"] });
  const canUpdateUsers = hasSessionPermissions(session, { user: ["update"] });
  const canSetRole = hasSessionPermissions(session, { user: ["set-role"] });
  const canBanUsers = hasSessionPermissions(session, { user: ["ban"] });
  const canDeleteUsers = hasSessionPermissions(session, { user: ["delete"] });
  const canSetPassword = hasSessionPermissions(session, { user: ["set-password"] });
  const canListSessions = hasSessionPermissions(session, { session: ["list"] });
  const canRevokeSessions = hasSessionPermissions(session, { session: ["revoke"] });

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );
  const elevatedUsers = useMemo(
    () => users.filter((user) => user.role === "owner" || user.role === "manager").length,
    [users]
  );
  const bannedUsers = useMemo(
    () => users.filter((user) => Boolean(user.banned)).length,
    [users]
  );
  const activeRoleFilterLabel =
    roleFilter === "all" ? "All roles" : adminRoleMeta[roleFilter].label;
  const sessionRoleLabel = getSessionRoleLabel(session);
  const isCurrentUser = selectedUser?.id === session?.user.id;

  async function refreshUsers(preferredUserId?: string | null) {
    setLoadingUsers(true);

    try {
      const response = await listStaffUsers({
        searchValue: deferredSearch.trim() || undefined,
        searchField: deferredSearch.includes("@") ? "email" : "name",
        searchOperator: "contains",
        sortBy: "name",
        sortDirection: "asc",
        limit: 100,
        offset: 0,
        filterField: roleFilter === "all" ? undefined : "role",
        filterValue: roleFilter === "all" ? undefined : roleFilter,
        filterOperator: roleFilter === "all" ? undefined : "eq",
      });

      startUiTransition(() => {
        setUsers(response.users);
        setResultTotal(response.total);
        setSelectedUserId((current) => {
          const preferred = preferredUserId ?? current;
          if (preferred && response.users.some((user) => user.id === preferred)) {
            return preferred;
          }
          return response.users[0]?.id ?? null;
        });
      });
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to load staff users.",
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function refreshSessions(userId: string) {
    if (!canListSessions) {
      setSelectedSessions([]);
      return;
    }

    setLoadingSessions(true);
    try {
      const sessions = await listStaffUserSessions(userId);
      startUiTransition(() => {
        setSelectedSessions(sessions);
      });
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to load user sessions.",
      });
    } finally {
      setLoadingSessions(false);
    }
  }

  useEffect(() => {
    refreshUsers(selectedUserId).catch(console.error);
  }, [deferredSearch, roleFilter]);

  useEffect(() => {
    if (!selectedUser) {
      setProfileDraft({
        name: "",
        email: "",
        username: "",
        role: defaultAdminRole,
      });
      setPasswordDraft("");
      setBanReason("Access removed");
      return;
    }

    setProfileDraft({
      name: selectedUser.name,
      email: selectedUser.email,
      username: selectedUser.username ?? "",
      role: toRoleSlug(selectedUser.role),
    });
    setPasswordDraft("");
    setBanReason(selectedUser.banReason || "Access removed");
  }, [selectedUser?.id]);

  useEffect(() => {
    if (!selectedUser || !canListSessions) {
      setSelectedSessions([]);
      return;
    }

    refreshSessions(selectedUser.id).catch(console.error);
  }, [selectedUser?.id, canListSessions]);

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    if (!canCreateUsers) return;

    setBusyAction("create");
    setNotice(null);

    try {
      const newUser = await createStaffUser({
        name: createDraft.name.trim(),
        email: createDraft.email.trim().toLowerCase(),
        username: createDraft.username.trim().toLowerCase(),
        password: createDraft.password,
        role: createDraft.role,
      });

      setCreateDraft(emptyCreateUserDraft);
      setNotice({
        tone: "green",
        message: `${newUser.name} was added and can now sign in.`,
      });
      await refreshUsers(newUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to create staff account.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    if (!selectedUser || !canUpdateUsers) return;

    setBusyAction("profile");
    setNotice(null);

    try {
      await updateStaffUser(selectedUser.id, {
        name: profileDraft.name.trim(),
        email: profileDraft.email.trim().toLowerCase(),
        username: profileDraft.username.trim().toLowerCase(),
        displayUsername: profileDraft.name.trim(),
      });

      setNotice({
        tone: "green",
        message: `${profileDraft.name} profile details saved.`,
      });
      await refreshUsers(selectedUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to update staff profile.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSaveRole() {
    if (!selectedUser || !canSetRole) return;

    setBusyAction("role");
    setNotice(null);

    try {
      await setStaffUserRole(selectedUser.id, profileDraft.role);
      setNotice({
        tone: "green",
        message: `${selectedUser.name} is now ${adminRoleMeta[profileDraft.role].label}.`,
      });
      await refreshUsers(selectedUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to change role.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleResetPassword() {
    if (!selectedUser || !canSetPassword) return;

    if (passwordDraft.length < 8) {
      setNotice({
        tone: "red",
        message: "Temporary passwords must be at least 8 characters.",
      });
      return;
    }

    setBusyAction("password");
    setNotice(null);

    try {
      await setStaffUserPassword(selectedUser.id, passwordDraft);
      setPasswordDraft("");
      setNotice({
        tone: "green",
        message: `Password reset saved for ${selectedUser.name}.`,
      });
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to reset password.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleToggleBan() {
    if (!selectedUser || !canBanUsers || isCurrentUser) return;

    setBusyAction("ban");
    setNotice(null);

    try {
      if (selectedUser.banned) {
        await unbanStaffUser(selectedUser.id);
        setNotice({
          tone: "green",
          message: `${selectedUser.name} can sign in again.`,
        });
      } else {
        await banStaffUser(selectedUser.id, banReason.trim() || "Access removed");
        setNotice({
          tone: "amber",
          message: `${selectedUser.name} has been suspended.`,
        });
      }

      await refreshUsers(selectedUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to update account status.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser || !canDeleteUsers || isCurrentUser) return;

    const confirmed = window.confirm(
      `Delete ${selectedUser.name}? This removes the user record and their sessions.`
    );
    if (!confirmed) return;

    setBusyAction("delete");
    setNotice(null);

    try {
      await removeStaffUser(selectedUser.id);
      setNotice({
        tone: "amber",
        message: `${selectedUser.name} was deleted.`,
      });
      await refreshUsers(null);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to delete user.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRevokeSession(sessionToken: string) {
    if (!selectedUser || !canRevokeSessions) return;

    setBusyAction(`revoke-${sessionToken}`);
    setNotice(null);

    try {
      await revokeStaffUserSession(sessionToken);
      setNotice({
        tone: "amber",
        message: "Selected session revoked.",
      });
      await refreshSessions(selectedUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to revoke session.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleRevokeAllSessions() {
    if (!selectedUser || !canRevokeSessions) return;

    setBusyAction("revoke-all");
    setNotice(null);

    try {
      await revokeAllStaffUserSessions(selectedUser.id);
      setNotice({
        tone: "amber",
        message: `All sessions revoked for ${selectedUser.name}.`,
      });
      await refreshSessions(selectedUser.id);
    } catch (error) {
      setNotice({
        tone: "red",
        message: (error as Error).message || "Unable to revoke all sessions.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AdminPage className="max-w-[1580px]">
      <PageHeader
        eyebrow="System"
        title="Staff users and live access control"
        description="Create named staff accounts, assign operational roles, rotate passwords, and revoke sessions without leaving the admin panel. This is the working surface for the Better Auth migration, not a placeholder settings page."
        meta={
          <>
            <InfoPill tone="green">Named staff accounts</InfoPill>
            <InfoPill tone={canCreateUsers ? "green" : "amber"}>
              {sessionRoleLabel}
            </InfoPill>
            <InfoPill tone="neutral">{resultTotal} visible staff records</InfoPill>
          </>
        }
        actions={
          <Link
            to="/access"
            className="admin-button-secondary rounded-2xl px-4 py-3 text-sm font-bold"
          >
            Open Access Matrix
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visible Staff"
          value={loadingUsers ? "..." : String(resultTotal)}
          note={`Filtered by ${activeRoleFilterLabel.toLowerCase()}`}
          tone="green"
        />
        <MetricCard
          label="Elevated Roles"
          value={loadingUsers ? "..." : String(elevatedUsers)}
          note="Owner and manager accounts in current result set"
          tone="amber"
        />
        <MetricCard
          label="Suspended Accounts"
          value={loadingUsers ? "..." : String(bannedUsers)}
          note="Accounts currently blocked from sign-in"
          tone={bannedUsers > 0 ? "red" : "slate"}
        />
        <MetricCard
          label="Selected Sessions"
          value={
            !canListSessions
              ? "Locked"
              : loadingSessions
                ? "..."
                : String(selectedSessions.length)
          }
          note={
            canListSessions
              ? "Live sessions for the selected staff account"
              : "Your role can inspect users but not session history"
          }
          tone={canListSessions ? "green" : "amber"}
        />
      </div>

      {notice ? <NoticeBanner tone={notice.tone}>{notice.message}</NoticeBanner> : null}

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-6">
          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title={canCreateUsers ? "Create staff account" : "Management posture"}
              description={
                canCreateUsers
                  ? "Provision staff access directly from the admin console with a role and starter password."
                  : "Your current role is read-only for user records. Owners can create accounts, set passwords, and suspend users."
              }
            />

            {canCreateUsers ? (
              <form onSubmit={handleCreateUser} className="grid gap-4">
                <InputField
                  label="Full name"
                  value={createDraft.name}
                  onChange={(value) =>
                    setCreateDraft((current) => ({ ...current, name: value }))
                  }
                  placeholder="Example: Ria Thomas"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={createDraft.email}
                  onChange={(value) =>
                    setCreateDraft((current) => ({ ...current, email: value }))
                  }
                  placeholder="staff@netsurf.example"
                />
                <InputField
                  label="Username"
                  value={createDraft.username}
                  onChange={(value) =>
                    setCreateDraft((current) => ({ ...current, username: value }))
                  }
                  placeholder="ria"
                />
                <InputField
                  label="Starter password"
                  type="password"
                  value={createDraft.password}
                  onChange={(value) =>
                    setCreateDraft((current) => ({ ...current, password: value }))
                  }
                  placeholder="Set a temporary password"
                />
                <SelectField
                  label="Operational role"
                  value={createDraft.role}
                  onChange={(value) =>
                    setCreateDraft((current) => ({
                      ...current,
                      role: value as AdminRoleSlug,
                    }))
                  }
                >
                  {roleOptions.map(([role, meta]) => (
                    <option key={role} value={role}>
                      {meta.label}
                    </option>
                  ))}
                </SelectField>

                <button
                  type="submit"
                  disabled={
                    busyAction === "create" ||
                    !createDraft.name ||
                    !createDraft.email ||
                    !createDraft.username ||
                    !createDraft.password
                  }
                  className="admin-button-primary mt-2 rounded-[1.2rem] px-5 py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busyAction === "create" ? "Creating account..." : "Create Staff Account"}
                </button>
              </form>
            ) : (
              <div className="rounded-[1.6rem] border border-amber-200/80 bg-amber-50/90 p-5">
                <p className="text-sm font-semibold text-amber-900">
                  This session can review users and, depending on role, inspect or revoke sessions, but it cannot provision new accounts.
                </p>
              </div>
            )}
          </PageSection>

          <PageSection className="p-6 sm:p-7">
            <SectionTitle
              title="Staff directory"
              description="Search by name or email, then narrow the list by role to find the right account quickly."
            />

            <div className="space-y-4">
              <SearchField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff name or email"
                label="Search staff"
              />

              <div className="admin-scrollbar flex gap-2 overflow-x-auto pb-1">
                <FilterChip
                  active={roleFilter === "all"}
                  onClick={() => setRoleFilter("all")}
                >
                  All roles
                </FilterChip>
                {roleOptions.map(([role, meta]) => (
                  <FilterChip
                    key={role}
                    active={roleFilter === role}
                    onClick={() => setRoleFilter(role)}
                  >
                    {meta.label}
                  </FilterChip>
                ))}
              </div>
            </div>

            <div className="admin-scrollbar mt-5 max-h-[720px] space-y-3 overflow-y-auto pr-1">
              {loadingUsers ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-[1.5rem] border border-border bg-white/70"
                  />
                ))
              ) : users.length === 0 ? (
                <EmptyState
                  title="No staff users match this view"
                  description="Change the role filter or search term to widen the result set."
                />
              ) : (
                users.map((user) => {
                  const role = toRoleSlug(user.role);
                  const active = user.id === selectedUserId;
                  const isViewer = user.id === session?.user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={cn(
                        "w-full rounded-[1.5rem] border p-4 text-left transition-[border-color,background-color,transform,box-shadow]",
                        active
                          ? "border-primary/22 bg-primary/8 shadow-[0_20px_35px_rgb(22_43_12_/10%)]"
                          : "border-primary/10 bg-white/74 hover:-translate-y-0.5 hover:border-primary/16 hover:bg-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/12 bg-primary/8 text-sm font-black text-primary">
                          {getInitials(user)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-base font-bold text-foreground">
                              {user.name}
                            </p>
                            <InfoPill tone="neutral">
                              {adminRoleMeta[role].label}
                            </InfoPill>
                            {user.banned ? (
                              <InfoPill tone="red">Suspended</InfoPill>
                            ) : null}
                            {isViewer ? <InfoPill tone="green">You</InfoPill> : null}
                          </div>

                          <p className="mt-2 truncate text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            @{user.username || "username pending"} · Added{" "}
                            {formatTimestamp(user.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </PageSection>
        </div>

        <PageSection className="p-6 sm:p-7">
          <SectionTitle
            title="Selected account"
            description="Inspect the chosen account, update profile details, and manage live sessions from one place."
          />

          {!selectedUser ? (
            <EmptyState
              title="Select a staff account"
              description="Choose a user from the directory to inspect role access, update credentials, or review session activity."
            />
          ) : (
            <div className="space-y-6">
              <div className="rounded-[1.8rem] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(196,148,26,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,240,231,0.86))] p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.6rem] border border-primary/12 bg-primary text-xl font-black text-white shadow-[0_16px_30px_rgb(45_80_22_/22%)]">
                      {getInitials(selectedUser)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">
                          {selectedUser.name}
                        </h2>
                        <InfoPill tone="neutral">
                          {adminRoleMeta[toRoleSlug(selectedUser.role)].label}
                        </InfoPill>
                        {selectedUser.banned ? (
                          <InfoPill tone="red">Suspended</InfoPill>
                        ) : (
                          <InfoPill tone="green">Active</InfoPill>
                        )}
                        {isCurrentUser ? <InfoPill tone="amber">Current session</InfoPill> : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        @{selectedUser.username || "username pending"} · {selectedUser.email}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Created {formatTimestamp(selectedUser.createdAt)} · Last updated{" "}
                        {formatTimestamp(selectedUser.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MiniStat
                      label="Role"
                      value={adminRoleMeta[toRoleSlug(selectedUser.role)].label}
                    />
                    <MiniStat
                      label="Sessions"
                      value={
                        canListSessions
                          ? loadingSessions
                            ? "..."
                            : String(selectedSessions.length)
                          : "Locked"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                  <div className="rounded-[1.6rem] border border-primary/10 bg-white/72 p-5">
                    <SectionTitle
                      title="Profile"
                      description="Staff identity fields used for sign-in and internal labeling."
                    />

                    {canUpdateUsers ? (
                      <form onSubmit={handleSaveProfile} className="grid gap-4">
                        <InputField
                          label="Full name"
                          value={profileDraft.name}
                          onChange={(value) =>
                            setProfileDraft((current) => ({
                              ...current,
                              name: value,
                            }))
                          }
                          placeholder="Staff full name"
                        />
                        <InputField
                          label="Email"
                          type="email"
                          value={profileDraft.email}
                          onChange={(value) =>
                            setProfileDraft((current) => ({
                              ...current,
                              email: value,
                            }))
                          }
                          placeholder="staff@netsurf.example"
                        />
                        <InputField
                          label="Username"
                          value={profileDraft.username}
                          onChange={(value) =>
                            setProfileDraft((current) => ({
                              ...current,
                              username: value,
                            }))
                          }
                          placeholder="staff username"
                        />
                        <button
                          type="submit"
                          disabled={busyAction === "profile"}
                          className="admin-button-secondary mt-2 rounded-[1.2rem] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyAction === "profile" ? "Saving profile..." : "Save Profile"}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <ReadonlyField label="Full name" value={selectedUser.name} />
                        <ReadonlyField label="Email" value={selectedUser.email} />
                        <ReadonlyField
                          label="Username"
                          value={`@${selectedUser.username || "username pending"}`}
                        />
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.6rem] border border-primary/10 bg-white/72 p-5">
                    <SectionTitle
                      title="Role assignment"
                      description="Controls which screens and protected actions this staff member can reach."
                    />

                    <SelectField
                      label="Assigned role"
                      value={profileDraft.role}
                      onChange={(value) =>
                        setProfileDraft((current) => ({
                          ...current,
                          role: value as AdminRoleSlug,
                        }))
                      }
                      disabled={!canSetRole}
                    >
                      {roleOptions.map(([role, meta]) => (
                        <option key={role} value={role}>
                          {meta.label}
                        </option>
                      ))}
                    </SelectField>

                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {adminRoleMeta[profileDraft.role].description}
                    </p>

                    {canSetRole ? (
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={busyAction === "role" || profileDraft.role === selectedUser.role}
                        className="admin-button-secondary mt-4 rounded-[1.2rem] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyAction === "role" ? "Updating role..." : "Save Role"}
                      </button>
                    ) : (
                      <div className="mt-4 rounded-[1.2rem] border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        Your current role cannot change role assignments.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[1.6rem] border border-primary/10 bg-white/72 p-5">
                    <SectionTitle
                      title="Password reset"
                      description="Set a fresh temporary password when a staff member is locked out or rotated into a new device."
                    />

                    {canSetPassword ? (
                      <div className="grid gap-4">
                        <InputField
                          label="Temporary password"
                          type="password"
                          value={passwordDraft}
                          onChange={setPasswordDraft}
                          placeholder="Enter a new temporary password"
                        />
                        <button
                          type="button"
                          onClick={handleResetPassword}
                          disabled={busyAction === "password" || passwordDraft.length < 8}
                          className="admin-button-secondary rounded-[1.2rem] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyAction === "password"
                            ? "Resetting password..."
                            : "Set Temporary Password"}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[1.2rem] border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        Password rotation is limited to higher-trust accounts.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[1.6rem] border border-primary/10 bg-white/72 p-5">
                    <SectionTitle
                      title="Account controls"
                      description="Suspend access, restore a suspended account, or remove an account entirely."
                    />

                    <div className="space-y-4">
                      <InputField
                        label="Suspension note"
                        value={banReason}
                        onChange={setBanReason}
                        placeholder="Reason staff should no longer sign in"
                        disabled={!canBanUsers || Boolean(selectedUser.banned)}
                      />

                      {selectedUser.banned ? (
                        <div className="rounded-[1.2rem] border border-red-200/80 bg-red-50 px-4 py-3">
                          <p className="text-sm font-semibold text-red-800">
                            Suspended reason: {selectedUser.banReason || "No reason recorded"}
                          </p>
                          <p className="mt-1 text-sm text-red-700">
                            Expires: {formatTimestamp(selectedUser.banExpires)}
                          </p>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleToggleBan}
                          disabled={busyAction === "ban" || !canBanUsers || isCurrentUser}
                          className={cn(
                            "rounded-[1.2rem] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50",
                            selectedUser.banned
                              ? "admin-button-secondary"
                              : "border border-red-200 bg-red-50 text-red-700 shadow-[0_12px_24px_rgb(185_28_28_/10%)]"
                          )}
                        >
                          {busyAction === "ban"
                            ? selectedUser.banned
                              ? "Restoring..."
                              : "Suspending..."
                            : selectedUser.banned
                              ? "Restore Access"
                              : "Suspend Account"}
                        </button>

                        <button
                          type="button"
                          onClick={handleDeleteUser}
                          disabled={busyAction === "delete" || !canDeleteUsers || isCurrentUser}
                          className="rounded-[1.2rem] border border-red-200/80 bg-white px-5 py-3 text-sm font-bold text-red-700 shadow-[0_12px_24px_rgb(185_28_28_/8%)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyAction === "delete" ? "Deleting..." : "Delete User"}
                        </button>
                      </div>

                      {isCurrentUser ? (
                        <div className="rounded-[1.2rem] border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                          You cannot suspend or delete the account tied to your current session.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-[1.6rem] border border-primary/10 bg-white/72 p-5">
                    <SectionTitle
                      title="Live sessions"
                      description="Inspect current sessions for the selected account and revoke them when access needs to be cut immediately."
                      action={
                        canRevokeSessions && selectedSessions.length > 0 ? (
                          <button
                            type="button"
                            onClick={handleRevokeAllSessions}
                            disabled={busyAction === "revoke-all"}
                            className="text-sm font-bold text-primary hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
                          >
                            {busyAction === "revoke-all"
                              ? "Revoking..."
                              : "Revoke all sessions"}
                          </button>
                        ) : null
                      }
                    />

                    {!canListSessions ? (
                      <div className="rounded-[1.2rem] border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
                        Your role cannot inspect session history.
                      </div>
                    ) : loadingSessions ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-20 animate-pulse rounded-[1.35rem] border border-border bg-white"
                          />
                        ))}
                      </div>
                    ) : selectedSessions.length === 0 ? (
                      <EmptyState
                        title="No active sessions"
                        description="This account does not currently have any tracked sessions."
                      />
                    ) : (
                      <div className="space-y-3">
                        {selectedSessions.map((userSession) => (
                          <div
                            key={userSession.id}
                            className="rounded-[1.35rem] border border-primary/10 bg-white p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-sm font-bold text-foreground">
                                  Session {userSession.token.slice(0, 10)}...
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  Started {formatTimestamp(userSession.createdAt)} · Expires{" "}
                                  {formatTimestamp(userSession.expiresAt)}
                                </p>
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {userSession.userAgent || "User agent unavailable"} ·{" "}
                                  {userSession.ipAddress || "IP unavailable"}
                                </p>
                              </div>

                              {canRevokeSessions ? (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSession(userSession.token)}
                                  disabled={busyAction === `revoke-${userSession.token}`}
                                  className="rounded-[1rem] border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {busyAction === `revoke-${userSession.token}`
                                    ? "Revoking..."
                                    : "Revoke"}
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageSection>
      </div>

      {isTransitionPending ? (
        <div className="fixed right-6 bottom-6 rounded-full border border-primary/10 bg-white/92 px-4 py-2 text-sm font-semibold text-primary shadow-[0_18px_40px_rgb(21_36_12_/14%)]">
          Syncing admin state...
        </div>
      ) : null}
    </AdminPage>
  );
}

function NoticeBanner({
  children,
  tone,
}: {
  children: string;
  tone: NoticeTone;
}) {
  const toneClass = {
    green: "border-primary/12 bg-primary/6 text-primary",
    amber: "border-amber-200/80 bg-amber-50 text-amber-900",
    red: "border-red-200/80 bg-red-50 text-red-800",
  }[tone];

  return (
    <div className={cn("rounded-[1.5rem] border px-5 py-4 text-sm font-semibold", toneClass)}>
      {children}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-primary/10 bg-white/70 px-4 py-3">
      <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function ReadonlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-primary/10 bg-primary/4 px-4 py-3">
      <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="admin-input w-full rounded-[1.2rem] px-4 py-3.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        disabled={disabled}
        className="admin-input w-full rounded-[1.2rem] px-4 py-3.5 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {children}
      </select>
    </label>
  );
}
