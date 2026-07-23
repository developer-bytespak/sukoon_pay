import { AnimatePresence, motion } from "framer-motion";
import type { LedgerEntry } from "../engine/types";
import type { Tone } from "./ui";
import { formatPKR } from "../engine/fees";
import { formatSimDate } from "../lib/format";

export default function LedgerTable({ entries, tone = "light" }: { entries: (LedgerEntry & { orderId?: string })[]; tone?: Tone }) {
  const dark = tone === "dark";
  if (entries.length === 0) {
    return (
      <p className={`py-6 text-center text-sm ${dark ? "text-white/30" : "text-stone-400"}`}>
        No ledger entries yet — money moves will appear here.
      </p>
    );
  }
  const cls = {
    headRow: dark ? "border-white/10 text-white/35" : "border-stone-200 text-stone-400",
    row: dark ? "border-white/5" : "border-stone-100",
    id: dark ? "text-white/40" : "text-stone-500",
    account: dark ? "text-white/80" : "",
    dr: dark ? "text-rose-400" : "text-rose-600",
    cr: dark ? "text-emerald-400" : "text-emerald-600",
    memo: dark ? "text-white/45" : "text-stone-500",
    when: dark ? "text-white/30" : "text-stone-400",
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className={`border-b ${cls.headRow}`}>
            <th className="py-1.5 pr-3 font-semibold">Txn</th>
            <th className="py-1.5 pr-3 font-semibold">Account</th>
            <th className="py-1.5 pr-3 font-semibold">DR</th>
            <th className="py-1.5 pr-3 font-semibold">CR</th>
            <th className="py-1.5 pr-3 font-semibold">Memo</th>
            <th className="py-1.5 font-semibold">When</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {entries.map((e, i) => (
              <motion.tr
                key={`${e.txnId}-${e.account}-${e.direction}-${i}`}
                initial={{ opacity: 0, backgroundColor: dark ? "rgba(52,211,153,0.15)" : "#d1fae5" }}
                animate={{ opacity: 1, backgroundColor: dark ? "rgba(255,255,255,0)" : "#ffffff" }}
                transition={{ duration: 0.9 }}
                className={`border-b ${cls.row}`}
              >
                <td className={`py-1.5 pr-3 font-mono ${cls.id}`}>{e.txnId}</td>
                <td className={`py-1.5 pr-3 font-mono ${cls.account}`}>{e.account}</td>
                <td className={`py-1.5 pr-3 font-semibold ${cls.dr}`}>{e.direction === "DR" ? formatPKR(e.amount) : ""}</td>
                <td className={`py-1.5 pr-3 font-semibold ${cls.cr}`}>{e.direction === "CR" ? formatPKR(e.amount) : ""}</td>
                <td className={`py-1.5 pr-3 ${cls.memo}`}>{e.memo}</td>
                <td className={`py-1.5 whitespace-nowrap ${cls.when}`}>{formatSimDate(e.timestamp)}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
