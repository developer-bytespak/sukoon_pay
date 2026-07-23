import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useStore } from "../../engine/store";
import type { Role } from "../../engine/types";
import { ROLE_CONFIGS } from "./roles";

export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const currentRole = useStore((s) => s.currentRole);
  if (currentRole !== role) return <Navigate to={ROLE_CONFIGS[role].authPath} replace />;
  return <>{children}</>;
}
