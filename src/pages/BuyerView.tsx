import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, ShieldCheck, ShoppingBag } from "lucide-react";
import { useStore } from "../engine/store";
import type { DisputeReason, Order } from "../engine/types";
import { ACCOUNTS, BUYER_STARTING_BALANCE, USERS } from "../engine/constants";
import { balanceOf } from "../engine/ledger";
import { formatPKR } from "../engine/fees";
import { remainingLabel } from "../lib/format";
import { Card, PageShell, StatePill } from "../components/ui";
import OrderTimeline from "../components/OrderTimeline";

const TRACKER = ["Paid", "Shipped", "Out for delivery", "Delivered", "Inspection", "Done"] as const;

function trackerIndex(o: Order): number {
  if (o.state === "RELEASED" || o.state === "REFUNDED" || o.state === "AUTO_REFUNDED") return 5;
  if (o.state === "DISPUTED") return 4;
  if (o.state === "INSPECTION_WINDOW") return 4;
  if (o.courier.status === "delivered") return 3;
  if (o.courier.status === "out_for_delivery") return 2;
  if (o.state === "SHIPPED") return 1;
  return 0;
}

function DisputeForm({ order, onClose }: { order: Order; onClose: () => void }) {
  const reportProblem = useStore((s) => s.reportProblem);
  const [reason, setReason] = useState<DisputeReason>("not_received");
  const [photoAttached, setPhotoAttached] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
      <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
        <p className="mb-3 text-sm font-bold text-rose-800">Report a problem — funds will be frozen while we adjudicate</p>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={reason === "not_received"} onChange={() => setReason("not_received")} />
            <span>I never received this order</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={reason === "defective"} onChange={() => setReason("defective")} />
            <span>Item is defective / not as described</span>
          </label>
        </div>
        {reason === "defective" && (
          <button
            onClick={() => setPhotoAttached(!photoAttached)}
            className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${
              photoAttached ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-stone-300 bg-white text-stone-600"
            }`}
          >
            <Camera size={14} /> {photoAttached ? "evidence-01.jpg attached ✓" : "Attach photo evidence"}
          </button>
        )}
        <p className="mt-3 text-xs text-rose-700/80">
          Disputes follow published, deterministic rules — you can predict the outcome in advance. No &quot;sole
          discretion.&quot; A fixed adjudication service fee (PKR 150) is allocated to the party at fault.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              reportProblem(order.id, reason, reason === "defective" && photoAttached ? "evidence-01.jpg" : null);
              onClose();
            }}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500"
          >
            Submit dispute
          </button>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BuyerOrderCard({ order }: { order: Order }) {
  const { clock, confirmReceipt } = useStore();
  const [disputing, setDisputing] = useState(false);
  const idx = trackerIndex(order);
  const inWindow = order.state === "INSPECTION_WINDOW";
  const refunded = order.state === "REFUNDED" || order.state === "AUTO_REFUNDED";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{order.productImage}</span>
          <div>
            <p className="font-bold">
              {order.id} · {order.productName}
            </p>
            <p className="text-xs text-stone-500">
              {formatPKR(order.amount)} · size {order.size} · via Bazaar.pk
            </p>
          </div>
        </div>
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} />
      </div>

      <div className="mt-5 flex items-center">
        {TRACKER.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  i <= idx ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-400"
                }`}
              >
                {i < idx || (i === idx && idx === 5) ? "✓" : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[10px] font-semibold ${i <= idx ? "text-stone-700" : "text-stone-400"}`}>
                {i === 4 && inWindow && order.inspectionWindowEndsAt
                  ? `Inspection: ${remainingLabel(order.inspectionWindowEndsAt, clock)}`
                  : i === 5
                    ? refunded
                      ? "Refunded"
                      : "Released"
                    : label}
              </span>
            </div>
            {i < TRACKER.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < idx ? "bg-emerald-600" : "bg-stone-200"}`} />}
          </div>
        ))}
      </div>

      {!refunded && order.state !== "RELEASED" && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <ShieldCheck size={14} className="shrink-0" />
          Your money is held safely in trust (Amanah) by Sukoon Pay until you confirm. It is not the seller&apos;s yet.
        </p>
      )}
      {order.state === "RELEASED" && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          <CheckCircle2 size={14} className="shrink-0" /> Order complete — payment was released to the seller.
        </p>
      )}
      {refunded && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
          <CheckCircle2 size={14} className="shrink-0" /> Your own funds were returned in full from trust — no premium, no
          pool, no insurance.
        </p>
      )}

      {inWindow && !disputing && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => confirmReceipt(order.id)}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500"
          >
            Confirm receipt
          </button>
          <button
            onClick={() => setDisputing(true)}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            Report a problem
          </button>
        </div>
      )}
      {disputing && <DisputeForm order={order} onClose={() => setDisputing(false)} />}

      {order.dispute && (
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-600">
          <p className="font-bold text-stone-800">Dispute status</p>
          <p className="mt-1">{order.dispute.ruleApplied}</p>
          <p className="mt-1">
            {order.dispute.resolution
              ? `Resolved: ${order.dispute.resolution === "refund" ? "refund to buyer" : "release to seller"}.`
              : `Awaiting adjudication — ${order.dispute.approvals.length}/2 approvals (four-eyes).`}
          </p>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-stone-400 hover:text-stone-600">Order timeline</summary>
        <div className="mt-3">
          <OrderTimeline events={order.timeline} />
        </div>
      </details>
    </Card>
  );
}

export default function BuyerView() {
  const orders = useStore((s) => s.orders);
  const balance = balanceOf(orders, ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE);

  return (
    <PageShell
      title={`Assalam-o-alaikum, ${USERS.buyer.name.split(" ")[0]}`}
      subtitle={`Consumer ID ${USERS.buyer.consumerId}`}
      badge={
        <div className="text-right">
          <p className="text-xs text-stone-400">Wallet balance</p>
          <p className="text-lg font-bold text-emerald-700">{formatPKR(balance)}</p>
        </div>
      }
    >
      <div className="space-y-4">
        {orders.length === 0 && (
          <Card className="text-center text-sm text-stone-500">
            <ShoppingBag className="mx-auto mb-2 text-stone-300" size={32} />
            No orders yet.{" "}
            <Link to="/bazaar" className="font-semibold text-emerald-700">
              Shop on Bazaar.pk →
            </Link>
          </Card>
        )}
        {[...orders].reverse().map((o) => (
          <BuyerOrderCard key={o.id} order={o} />
        ))}
      </div>
    </PageShell>
  );
}
