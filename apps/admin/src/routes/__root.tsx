import { createRootRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { isAuthenticated } from "@/lib/api";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    if (!isAuthenticated() && location.pathname !== "/login") {
      throw redirect({ to: "/login" });
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
