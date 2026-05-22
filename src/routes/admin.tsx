import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession, isAdminUser } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  component: () => <Outlet />,
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      return redirect({ to: "/" });
    }
    if (!(await isAdminUser(session.user))) {
      return redirect({ to: "/dashboard" });
    }
  },
});