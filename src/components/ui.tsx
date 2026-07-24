import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { OrderState } from "../engine/types";

export type Tone = "light" | "dark";

export const STATE_META: Record<OrderState, { label: string; classes: string; darkClasses: string }> = {
  CREATED: { label: "Created", classes: "bg-stone-100 text-stone-600 border-stone-300", darkClasses: "bg-white/5 text-white/50 border-white/15" },
  HELD_IN_ESCROW: { label: "In Escrow · pending", classes: "bg-amber-50 text-amber-700 border-amber-300", darkClasses: "bg-amber-400/10 text-amber-300 border-amber-400/30" },
  SHIPPED: { label: "Shipped", classes: "bg-sky-50 text-sky-700 border-sky-300", darkClasses: "bg-sky-400/10 text-sky-300 border-sky-400/30" },
  INSPECTION_WINDOW: { label: "Inspection window", classes: "bg-violet-50 text-violet-700 border-violet-300", darkClasses: "bg-violet-400/10 text-violet-300 border-violet-400/30" },
  DISPUTED: { label: "Disputed · frozen", classes: "bg-rose-50 text-rose-700 border-rose-300", darkClasses: "bg-rose-400/10 text-rose-300 border-rose-400/30" },
  RELEASED: { label: "Released", classes: "bg-emerald-50 text-emerald-700 border-emerald-300", darkClasses: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30" },
  REFUNDED: { label: "Refunded", classes: "bg-orange-50 text-orange-700 border-orange-300", darkClasses: "bg-orange-400/10 text-orange-300 border-orange-400/30" },
  AUTO_REFUNDED: { label: "Auto-refunded", classes: "bg-orange-50 text-orange-700 border-orange-300", darkClasses: "bg-orange-400/10 text-orange-300 border-orange-400/30" },
  CANCELLED: { label: "Cancelled", classes: "bg-stone-100 text-stone-500 border-stone-300", darkClasses: "bg-white/5 text-white/40 border-white/15" },
};

export function StatePill({ state, flagged, tone = "light" }: { state: OrderState; flagged?: boolean; tone?: Tone }) {
  const meta = STATE_META[state];
  const flagCls =
    tone === "dark"
      ? "border-rose-400/30 bg-rose-400/10 text-rose-300"
      : "border-rose-300 bg-rose-50 text-rose-700";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone === "dark" ? meta.darkClasses : meta.classes}`}>
        {meta.label}
      </span>
      {flagged && <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${flagCls}`}>⚠ Held for review</span>}
    </span>
  );
}

// Product art: an image path for catalog products, with a fallback for
// emoji strings that may survive in older persisted demo state.
export function ProductThumb({ src, alt = "", className = "h-12 w-12" }: { src: string; alt?: string; className?: string }) {
  if (src.startsWith("/") || src.startsWith("http")) {
    return <img src={src} alt={alt} className={`shrink-0 rounded-xl object-cover ${className}`} />;
  }
  return <span className="shrink-0 text-3xl">{src}</span>;
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
