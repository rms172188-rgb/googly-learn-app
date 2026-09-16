import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, type Role } from "@/lib/auth";
import { Loading } from "@/components/common";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void navigate({ to: "/login", replace: true });
      return;
    }
    if (role && !roles.includes(role)) {
      if (role === "super_admin")
        void navigate({ to: "/admin/$section", params: { section: "dashboard" }, replace: true });
      else if (role === "teacher")
        void navigate({ to: "/teacher/$section", params: { section: "dashboard" }, replace: true });
      else void navigate({ to: "/app/$section", params: { section: "home" }, replace: true });
    }
  }, [loading, session, role, roles, navigate]);

  if (loading) return <Loading label="Checking your access" />;
  if (!session || !role || !roles.includes(role)) return <Loading label="Redirecting" />;
  return <>{children}</>;
}
