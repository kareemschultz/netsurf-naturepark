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
    <div className="flex min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
