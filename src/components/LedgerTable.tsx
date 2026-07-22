import { AnimatePresence, motion } from "framer-motion";
import type { LedgerEntry } from "../engine/types";
import { formatPKR } from "../engine/fees";
import { formatSimDate } from "../lib/format";

export default function LedgerTable({ entries }: { entries: (LedgerEntry & { orderId?: string })[] }) {
  if (entries.length === 0) {
    return <p className="py-6 text-center text-sm text-stone-400">No ledger entries yet — money moves will appear here.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-stone-200 text-stone-400">
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
                initial={{ opacity: 0, backgroundColor: "#d1fae5" }}
                animate={{ opacity: 1, backgroundColor: "#ffffff" }}
                transition={{ duration: 0.9 }}
                className="border-b border-stone-100"
              >
                <td className="py-1.5 pr-3 font-mono text-stone-500">{e.txnId}</td>
                <td className="py-1.5 pr-3 font-mono">{e.account}</td>
                <td className="py-1.5 pr-3 font-semibold text-rose-600">{e.direction === "DR" ? formatPKR(e.amount) : ""}</td>
                <td className="py-1.5 pr-3 font-semibold text-emerald-600">{e.direction === "CR" ? formatPKR(e.amount) : ""}</td>
                <td className="py-1.5 pr-3 text-stone-500">{e.memo}</td>
                <td className="py-1.5 whitespace-nowrap text-stone-400">{formatSimDate(e.timestamp)}</td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
