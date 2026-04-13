import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import {
  canSessionAccess,
  fetchAdminSession,
  getSessionLandingPath,
  normalizeAdminPathname,
} from "@/lib/auth";
import { ThemeProvider } from "@/context/theme-context";
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { ThemeSwitch } from "@/components/theme-switch";
import { CommandPalette } from "@/components/command-palette";
import { NotFound } from "@/components/errors/not-found";
import { ServerError } from "@/components/errors/server-error";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const session = await fetchAdminSession();
    const adminPathname = normalizeAdminPathname(location.pathname);

    if (!session && adminPathname !== "/login") {
      throw redirect({ to: "/login" });
    }

    if (!session) return;

    if (adminPathname === "/login") {
      throw redirect({ to: getSessionLandingPath(session) });
    }

    if (!canSessionAccess(adminPathname, session)) {
      throw redirect({ to: getSessionLandingPath(session) });
    }
  },
  component: RootLayout,
  errorComponent: ({ error, reset }) => (
    <ServerError error={error as Error} onRetry={reset} />
  ),
  notFoundComponent: () => <NotFound />,
});

function RootLayout() {
  const { location } = useRouterState();
  const adminPathname = normalizeAdminPathname(location.pathname);
  const isLogin = adminPathname === "/login";

  // Login page — no sidebar
  if (isLogin) {
    return (
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header fixed>
            <ThemeSwitch />
          </Header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <Outlet />
          </div>
        </SidebarInset>
        {/* Command palette is mounted globally so Cmd+K works everywhere */}
        <CommandPalette />
      </SidebarProvider>
    </ThemeProvider>
  );
}
