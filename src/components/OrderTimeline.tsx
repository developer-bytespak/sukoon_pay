import { motion } from "framer-motion";
import type { TimelineEvent } from "../engine/types";
import type { Tone } from "./ui";
import { formatSimDate } from "../lib/format";

export default function OrderTimeline({ events, tone = "light" }: { events: TimelineEvent[]; tone?: Tone }) {
  const dark = tone === "dark";
  return (
    <ol className={`relative ml-2 space-y-4 border-l-2 pl-5 ${dark ? "border-emerald-400/20" : "border-emerald-100"}`}>
      {events.map((e, i) => (
        <motion.li
          key={`${e.at}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <span
            className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 bg-emerald-500 ${dark ? "border-stone-900" : "border-white"}`}
          />
          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-stone-800"}`}>{e.label}</p>
          {e.detail && <p className={`text-xs ${dark ? "text-white/45" : "text-stone-500"}`}>{e.detail}</p>}
          <p className={`mt-0.5 text-[11px] ${dark ? "text-white/30" : "text-stone-400"}`}>{formatSimDate(e.at)}</p>
        </motion.li>
      ))}
    </ol>
  );
}
