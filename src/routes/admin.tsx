import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, getUserRoles, resolveHomeRoute } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: () => <Outlet />,
  // @ts-expect-error TanStack Router v1 beforeLoad type variance
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      return redirect({ to: "/" });
    }
    const roles = await getUserRoles(session.user);
    // Admin section is open to super_admin and proctor roles.
    if (!roles.includes("super_admin") && !roles.includes("proctor")) {
      const home = await resolveHomeRoute(session.user);
      return redirect({ to: home as any });
    }
  },
});