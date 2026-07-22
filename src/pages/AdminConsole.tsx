import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Landmark, Scale, UserCheck } from "lucide-react";
import { useStore } from "../engine/store";
import type { Order } from "../engine/types";
import { ACCOUNTS, ADJUDICATION_FEE, BUYER_STARTING_BALANCE, USERS } from "../engine/constants";
import { balanceOf } from "../engine/ledger";
import { formatPKR } from "../engine/fees";
import { Card, PageShell, StatePill } from "../components/ui";
import StateMachineDiagram from "../components/StateMachineDiagram";
import LedgerTable from "../components/LedgerTable";
import OrderTimeline from "../components/OrderTimeline";

function DisputeCard({ order }: { order: Order }) {
  const approveResolution = useStore((s) => s.approveResolution);
  const d = order.dispute!;
  const approvedBy = (id: string) => d.approvals.some((a) => a.adminId === id);

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-stone-800">
          {order.id} · {order.productName} · {formatPKR(order.amount)}
        </p>
        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
          {d.reason === "not_received" ? "Non-receipt claim" : "Defective / SNAD"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-white p-2.5">
          <p className="font-bold text-stone-500">Buyer evidence</p>
          <p className="text-stone-700">{d.buyerEvidence ?? "None submitted"}</p>
        </div>
        <div className="rounded-lg bg-white p-2.5">
          <p className="font-bold text-stone-500">Seller / courier evidence</p>
          <p className="text-stone-700">
            {order.courier.proof
              ? `${order.courier.proof.type}: ${order.courier.proof.value} · GPS ${order.courier.proof.gpsMatch ? "✓" : "✗"}`
              : "No proof of delivery on file"}
          </p>
        </div>
        <div className="rounded-lg bg-white p-2.5">
          <p className="font-bold text-stone-500">Published rule applied</p>
          <p className="text-stone-700">{d.ruleApplied}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-stone-500">
        Deterministic outcome: <span className="font-bold text-stone-800">{d.suggestedResolution === "refund" ? "Refund to buyer" : "Release to seller"}</span> · Adjudication service fee {formatPKR(ADJUDICATION_FEE)} allocated to the party at fault (a
        service charge, never a penalty).
      </p>

      {d.resolution ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
          ✓ Resolved: {d.resolution === "refund" ? "refunded to buyer" : "released to seller"} — approved by{" "}
          {d.approvals.map((a) => a.adminName).join(" and ")}.
        </p>
      ) : (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-600">
            <UserCheck size={13} /> Four-eyes approval — money moves only after two distinct approvers ({d.approvals.length}/2)
          </p>
          <div className="flex gap-2">
            {[USERS.adminA, USERS.adminB].map((admin) => (
              <button
                key={admin.id}
                disabled={approvedBy(admin.id)}
                onClick={() => approveResolution(order.id, admin.id, admin.name)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
                  approvedBy(admin.id)
                    ? "cursor-not-allowed bg-emerald-100 text-emerald-700"
                    : "bg-stone-900 text-white hover:bg-stone-700"
                }`}
              >
                {approvedBy(admin.id) ? `✓ ${admin.name}` : `Approve as ${admin.name}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlaggedCard({ order }: { order: Order }) {
  const { clearFlag, refundFlagged } = useStore();
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-amber-900">
        <AlertTriangle size={15} /> {order.id} — “Delivered” with suspicious proof
      </p>
      <p className="mt-1 text-xs text-amber-800">
        {order.courier.proof
          ? `Proof: ${order.courier.proof.type} (${order.courier.proof.value}) · GPS match: ${order.courier.proof.gpsMatch ? "yes" : "NO"}`
          : "No proof supplied."}{" "}
        Funds stay held — we do not naïvely trust the courier.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => clearFlag(order.id)}
          className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
        >
          Accept proof → open inspection window
        </button>
        <button
          onClick={() => refundFlagged(order.id)}
          className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-500"
        >
          Reject proof → refund buyer
        </button>
      </div>
    </div>
  );
}

export default function AdminConsole() {
  const orders = useStore((s) => s.orders);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalInTrust = orders.reduce((sum, o) => sum + balanceOf([o], ACCOUNTS.escrow(o.id)), 0);
  const selected = orders.find((o) => o.id === selectedId) ?? orders[orders.length - 1] ?? null;
  const disputes = orders.filter((o) => o.dispute);
  const flagged = orders.filter((o) => o.courier.flaggedForReview);

  const accounts = [
    { name: "platform_fee", balance: balanceOf(orders, ACCOUNTS.platformFee), note: "Wakala + verification fees earned" },
    { name: "purification", balance: balanceOf(orders, ACCOUNTS.purification), note: "Charity account for any non-halal income" },
    { name: "seller_wallet", balance: balanceOf(orders, ACCOUNTS.sellerWallet), note: "Merchant withdrawable balance" },
    { name: "buyer_wallet", balance: balanceOf(orders, ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE), note: "Consumer wallet" },
  ];

  return (
    <PageShell
      title="Escrow console"
      subtitle="Sukoon Pay internal — trust account operations & adjudication"
      badge={
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <Landmark size={12} /> Total held in trust (Amanah)
          </p>
          <motion.p key={totalInTrust} initial={{ scale: 1.08 }} animate={{ scale: 1 }} className="text-2xl font-black text-emerald-800">
            {formatPKR(totalInTrust)}
          </motion.p>
          <p className="text-[10px] text-emerald-700/70">Segregated trust account · never invested · nobody's to spend</p>
        </div>
      }
    >
      {(flagged.length > 0 || disputes.length > 0) && (
        <div className="mb-5 space-y-3">
          {flagged.map((o) => (
            <FlaggedCard key={o.id} order={o} />
          ))}
          {disputes.length > 0 && (
            <Card>
              <h2 className="mb-3 flex items-center gap-2 font-bold text-stone-800">
                <Scale size={16} className="text-stone-400" /> Dispute queue — published rules, four-eyes release
              </h2>
              <div className="space-y-3">
                {disputes.map((o) => (
                  <DisputeCard key={o.id} order={o} />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-2 text-sm font-bold text-stone-800">Per-order escrow accounts</h2>
          {orders.length === 0 && <p className="py-4 text-center text-xs text-stone-400">No escrow accounts open.</p>}
          <div className="space-y-1">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  selected?.id === o.id ? "bg-emerald-50 ring-1 ring-emerald-300" : "hover:bg-stone-50"
                }`}
              >
                <span className="font-mono font-semibold">escrow:{o.id}</span>
                <span className="font-bold">{formatPKR(balanceOf([o], ACCOUNTS.escrow(o.id)))}</span>
              </button>
            ))}
          </div>
          <h2 className="mb-2 mt-5 text-sm font-bold text-stone-800">Chart of accounts</h2>
          <div className="space-y-1.5">
            {accounts.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs">
                <div>
                  <p className="font-mono font-semibold">{a.name}</p>
                  <p className="text-[10px] text-stone-400">{a.note}</p>
                </div>
                <span className="font-bold">{formatPKR(a.balance)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          {selected ? (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-stone-800">
                  {selected.id} · {selected.productName} · {formatPKR(selected.amount)}
                </h2>
                <StatePill state={selected.state} flagged={selected.courier.flaggedForReview} />
              </div>
              <StateMachineDiagram order={selected} />
              <h3 className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-stone-400">
                Double-entry ledger (fake money, real arithmetic)
              </h3>
              <LedgerTable entries={selected.ledgerEntries} />
              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-semibold text-stone-400 hover:text-stone-600">
                  Audit timeline
                </summary>
                <div className="mt-3">
                  <OrderTimeline events={selected.timeline} />
                </div>
              </details>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-stone-400">Select an order — or create one via Bazaar.pk / a scenario.</p>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
