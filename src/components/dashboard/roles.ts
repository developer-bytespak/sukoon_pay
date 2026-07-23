import type { Role } from "../../engine/types";

// Full literal Tailwind class strings (v4 cannot build dynamic class names).
export interface RoleConfig {
  role: Role;
  label: string;
  portalTagline: string;
  dashboardPath: string;
  authPath: string;
  hasSignup: boolean;
  accentText: string;
  accentChip: string;
  accentSolid: string;
}

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  buyer: {
    role: "buyer",
    label: "Buyer",
    portalTagline: "Track protected orders, confirm deliveries, get refunds",
    dashboardPath: "/buyer-dashboard",
    authPath: "/buyer-dashboard/login",
    hasSignup: true,
    accentText: "text-emerald-400",
    accentChip: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    accentSolid: "bg-emerald-500 text-stone-950 hover:bg-emerald-400 shadow-emerald-500/25",
  },
  seller: {
    role: "seller",
    label: "Seller",
    portalTagline: "Escrow balances, same-day settlement, store integrations",
    dashboardPath: "/seller-dashboard",
    authPath: "/seller-dashboard/login",
    hasSignup: true,
    accentText: "text-teal-400",
    accentChip: "border-teal-400/30 bg-teal-400/10 text-teal-300",
    accentSolid: "bg-teal-500 text-stone-950 hover:bg-teal-400 shadow-teal-500/25",
  },
  courier: {
    role: "courier",
    label: "Courier",
    portalTagline: "Partner ops console for shipments and proof of delivery",
    dashboardPath: "/courier-dashboard",
    authPath: "/courier-dashboard/login",
    hasSignup: false,
    accentText: "text-amber-400",
    accentChip: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    accentSolid: "bg-amber-500 text-stone-950 hover:bg-amber-400 shadow-amber-500/25",
  },
  admin: {
    role: "admin",
    label: "Admin",
    portalTagline: "Trust account operations, adjudication, the escrow ledger",
    dashboardPath: "/admin-dashboard",
    authPath: "/admin-dashboard/login",
    hasSignup: false,
    accentText: "text-violet-400",
    accentChip: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    accentSolid: "bg-violet-500 text-stone-950 hover:bg-violet-400 shadow-violet-500/25",
  },
};
