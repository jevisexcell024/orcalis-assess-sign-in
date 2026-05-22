import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, getUserRoles, resolveHomeRoute } from "@/lib/auth";

export const Route = createFileRoute("/student")({
  component: () => <Outlet />,
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) return redirect({ to: "/" });
    const roles = await getUserRoles(session.user);
    if (!roles.includes("candidate") && !roles.includes("super_admin")) {
      return redirect({ to: await resolveHomeRoute(session.user) });
    }
  },
});