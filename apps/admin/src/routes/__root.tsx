import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import {
  canSessionAccess,
  fetchAdminSession,
  getSessionLandingPath,
} from "@/lib/auth";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const session = await fetchAdminSession();

    if (!session && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
    }

    if (!session) return;

    if (location.pathname === "/login") {
      throw redirect({ to: getSessionLandingPath(session) });
    }

    if (!canSessionAccess(location.pathname, session)) {
      throw redirect({ to: getSessionLandingPath(session) });
    }
  },
  component: RootLayout,
});

function RootLayout() {
  const { location } = useRouterState();
  const isLogin = location.pathname === "/login";

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <div className="admin-shell">
      <div className="relative mx-auto min-h-screen max-w-[1800px] px-4 py-4 lg:flex lg:gap-6 lg:px-6 lg:py-6">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
