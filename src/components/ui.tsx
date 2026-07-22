import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { OrderState } from "../engine/types";

export const STATE_META: Record<OrderState, { label: string; classes: string }> = {
  CREATED: { label: "Created", classes: "bg-stone-100 text-stone-600 border-stone-300" },
  HELD_IN_ESCROW: { label: "In Escrow — pending", classes: "bg-amber-50 text-amber-700 border-amber-300" },
  SHIPPED: { label: "Shipped", classes: "bg-sky-50 text-sky-700 border-sky-300" },
  INSPECTION_WINDOW: { label: "Inspection window", classes: "bg-violet-50 text-violet-700 border-violet-300" },
  DISPUTED: { label: "Disputed — frozen", classes: "bg-rose-50 text-rose-700 border-rose-300" },
  RELEASED: { label: "Released", classes: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  REFUNDED: { label: "Refunded", classes: "bg-orange-50 text-orange-700 border-orange-300" },
  AUTO_REFUNDED: { label: "Auto-refunded", classes: "bg-orange-50 text-orange-700 border-orange-300" },
  CANCELLED: { label: "Cancelled", classes: "bg-stone-100 text-stone-500 border-stone-300" },
};

export function StatePill({ state, flagged }: { state: OrderState; flagged?: boolean }) {
  const meta = STATE_META[state];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.classes}`}>{meta.label}</span>
      {flagged && (
        <span className="rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
          ⚠ Held for review
        </span>
      )}
    </span>
  );
}

export function SukoonLogo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white">س</span>
      <span className={`text-lg font-bold ${light ? "text-white" : "text-emerald-900"}`}>
        Sukoon <span className="text-emerald-600">Pay</span>
      </span>
    </Link>
  );
}

export function PageShell({ title, subtitle, badge, children }: { title: string; subtitle?: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-4">
          <SukoonLogo />
          <div>
            <h1 className="text-xl font-bold text-stone-900">{title}</h1>
            {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
          </div>
        </div>
        {badge}
      </header>
      {children}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}
