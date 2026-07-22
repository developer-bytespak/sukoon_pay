import { motion } from "framer-motion";
import type { TimelineEvent } from "../engine/types";
import { formatSimDate } from "../lib/format";

export default function OrderTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative ml-2 space-y-4 border-l-2 border-emerald-100 pl-5">
      {events.map((e, i) => (
        <motion.li
          key={`${e.at}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          <p className="text-sm font-semibold text-stone-800">{e.label}</p>
          {e.detail && <p className="text-xs text-stone-500">{e.detail}</p>}
          <p className="mt-0.5 text-[11px] text-stone-400">{formatSimDate(e.at)}</p>
        </motion.li>
      ))}
    </ol>
  );
}
