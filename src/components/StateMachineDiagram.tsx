import type { Order, OrderState } from "../engine/types";
import type { Tone } from "./ui";
import { STATE_META } from "./ui";

const MAIN_PATH: OrderState[] = ["CREATED", "HELD_IN_ESCROW", "SHIPPED", "INSPECTION_WINDOW", "RELEASED"];
const BRANCHES: { from: string; state: OrderState; note: string }[] = [
  { from: "INSPECTION_WINDOW", state: "DISPUTED", note: "buyer reports a problem" },
  { from: "DISPUTED", state: "REFUNDED", note: "adjudicated · four-eyes" },
  { from: "HELD_IN_ESCROW", state: "AUTO_REFUNDED", note: "3-day no-ship timer" },
];

function Node({ state, active, tone }: { state: OrderState; active: boolean; tone: Tone }) {
  const meta = STATE_META[state];
  const activeCls = tone === "dark" ? meta.darkClasses : meta.classes;
  const idleCls =
    tone === "dark" ? "border-white/10 bg-white/[0.03] text-white/30" : "border-stone-200 bg-stone-50 text-stone-400";
  return (
    <span
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
        active ? `${activeCls} ring-2 ring-emerald-500 ring-offset-1 ${tone === "dark" ? "ring-offset-stone-900" : ""}` : idleCls
      }`}
    >
      {meta.label}
    </span>
  );
}

export default function StateMachineDiagram({ order, tone = "light" }: { order: Order; tone?: Tone }) {
  const dark = tone === "dark";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {MAIN_PATH.map((s, i) => (
          <span key={s} className="flex items-center gap-1.5">
            {i > 0 && <span className={dark ? "text-white/20" : "text-stone-300"}>→</span>}
            <Node state={s} active={order.state === s} tone={tone} />
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
        {BRANCHES.map((b) => (
          <span key={b.state} className={`flex items-center gap-1.5 text-xs ${dark ? "text-white/35" : "text-stone-400"}`}>
            <span>{STATE_META[b.from as OrderState]?.label ?? b.from}</span>
            <span className={dark ? "text-white/20" : "text-stone-300"}>⤷</span>
            <Node state={b.state} active={order.state === b.state} tone={tone} />
            <span className="italic">({b.note})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
