import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

export const darkInputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.08]";

export function GlassCard({ children, className = "", ...rest }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur ${className}`} {...rest}>
      {children}
    </div>
  );
}

// Stat tile: big value in ink, muted label, no chart junk.
export function Kpi({ label, value, sub, accent = false }: { label: string; value: ReactNode; sub?: string; accent?: boolean }) {
  return (
    <GlassCard className="!p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/35">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold tabular-nums ${accent ? "text-emerald-400" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-white/35">{sub}</p>}
    </GlassCard>
  );
}

export function SectionHeader({ icon: Icon, title, sub, id }: { icon: LucideIcon; title: string; sub?: string; id?: string }) {
  return (
    <div id={id} className="mb-4 mt-10 flex scroll-mt-28 items-start gap-2.5 first:mt-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-emerald-400">
        <Icon size={15} />
      </span>
      <div>
        <h2 className="font-display text-lg font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
    </div>
  );
}
