import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, Clock, Package, ShieldCheck, ShoppingBag } from "lucide-react";
import { useStore } from "../../engine/store";
import type { DisputeReason, Order } from "../../engine/types";
import { ACCOUNTS, BUYER_STARTING_BALANCE, USERS } from "../../engine/constants";
import { balanceOf } from "../../engine/ledger";
import { formatPKR } from "../../engine/fees";
import { formatSimDate, remainingLabel } from "../../lib/format";
import { ProductThumb, StatePill } from "../../components/ui";
import OrderTimeline from "../../components/OrderTimeline";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { GlassCard, Kpi, SectionHeader } from "../../components/dashboard/ui";

const TRACKER = ["Paid", "Shipped", "Out for delivery", "Delivered", "Inspection", "Done"] as const;
const ACTIVE_STATES = ["CREATED", "HELD_IN_ESCROW", "SHIPPED", "INSPECTION_WINDOW", "DISPUTED"];

function trackerIndex(o: Order): number {
  if (o.state === "RELEASED" || o.state === "REFUNDED" || o.state === "AUTO_REFUNDED") return 5;
  if (o.state === "DISPUTED" || o.state === "INSPECTION_WINDOW") return 4;
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
      <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/[0.07] p-4">
        <p className="mb-3 text-sm font-bold text-rose-300">Report a problem. Funds will be frozen while we adjudicate.</p>
        <div className="space-y-2 text-sm text-white/80">
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
            className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
              photoAttached
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-white/15 bg-white/[0.04] text-white/60"
            }`}
          >
            <Camera size={14} /> {photoAttached ? "evidence-01.jpg attached ✓" : "Attach photo evidence"}
          </button>
        )}
        <p className="mt-3 text-xs text-rose-300/70">
          Disputes follow published, deterministic rules. You can predict the outcome in advance. No "sole discretion." A
          fixed adjudication service fee (PKR 150) is allocated to the party at fault.
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => {
              reportProblem(order.id, reason, reason === "defective" && photoAttached ? "evidence-01.jpg" : null);
              onClose();
            }}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-400"
          >
            Submit dispute
          </button>
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-white/50 transition hover:bg-white/5">
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
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <ProductThumb src={order.productImage} alt={order.productName} />
          <div>
            <p className="font-bold text-white">
              {order.id} · {order.productName}
            </p>
            <p className="text-xs text-white/40">
              {formatPKR(order.amount)} · {(order.items ?? []).reduce((n, i) => n + i.qty, 0) || 1}{" "}
              {((order.items ?? []).reduce((n, i) => n + i.qty, 0) || 1) === 1 ? "item" : "items"} · via Shopping.pk
            </p>
          </div>
        </div>
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} tone="dark" />
      </div>

      <div className="mt-5 flex items-center">
        {TRACKER.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  i <= idx ? "bg-emerald-500 text-stone-950" : "bg-white/10 text-white/30"
                }`}
              >
                {i < idx || (i === idx && idx === 5) ? "✓" : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[10px] font-semibold ${i <= idx ? "text-white/80" : "text-white/30"}`}>
                {i === 4 && inWindow && order.inspectionWindowEndsAt
                  ? `Inspection: ${remainingLabel(order.inspectionWindowEndsAt, clock)}`
                  : i === 5
                    ? refunded
                      ? "Refunded"
                      : "Released"
                    : label}
              </span>
            </div>
            {i < TRACKER.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < idx ? "bg-emerald-500" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {!refunded && order.state !== "RELEASED" && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs text-emerald-200">
          <ShieldCheck size={14} className="shrink-0" />
          Your money is held safely in trust (Amanah) by Sukoon Pay until you confirm. It is not the seller&apos;s yet.
        </p>
      )}
      {order.state === "RELEASED" && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-2 text-xs text-emerald-200">
          <CheckCircle2 size={14} className="shrink-0" /> Order complete. Payment was released to the seller.
        </p>
      )}
      {refunded && (
        <p className="mt-4 flex items-center gap-1.5 rounded-lg border border-orange-400/20 bg-orange-400/[0.07] px-3 py-2 text-xs text-orange-200">
          <CheckCircle2 size={14} className="shrink-0" /> Your own funds were returned in full from trust. No premium, no
          pool, no insurance.
        </p>
      )}

      {inWindow && !disputing && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => confirmReceipt(order.id)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-stone-950 transition hover:bg-emerald-400"
          >
            Confirm receipt
          </button>
          <button
            onClick={() => setDisputing(true)}
            className="rounded-lg border border-rose-400/30 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/10"
          >
            Report a problem
          </button>
        </div>
      )}
      {disputing && <DisputeForm order={order} onClose={() => setDisputing(false)} />}

      {order.dispute && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/60">
          <p className="font-bold text-white">Dispute status</p>
          <p className="mt-1">{order.dispute.ruleApplied}</p>
          <p className="mt-1">
            {order.dispute.resolution
              ? `Resolved: ${order.dispute.resolution === "refund" ? "refund to buyer" : "release to seller"}.`
              : `Awaiting adjudication: ${order.dispute.approvals.length}/2 approvals (four-eyes).`}
          </p>
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-white/30 transition hover:text-white/60">Order timeline</summary>
        <div className="mt-3">
          <OrderTimeline events={order.timeline} tone="dark" />
        </div>
      </details>
    </GlassCard>
  );
}

export default function BuyerDashboard() {
  const orders = useStore((s) => s.orders ?? []);
  const balance = balanceOf(orders, ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE);
  const active = orders.filter((o) => ACTIVE_STATES.includes(o.state));
  const history = orders.filter((o) => !ACTIVE_STATES.includes(o.state));
  const inEscrow = active.reduce((sum, o) => sum + balanceOf([o], ACCOUNTS.escrow(o.id)), 0);

  return (
    <DashboardShell
      role="buyer"
      title={`Assalam-o-alaikum, ${USERS.buyer.name.split(" ")[0]}`}
      subtitle={`Consumer ID ${USERS.buyer.consumerId}`}
      nav={[
        { id: "orders", label: "Orders", icon: Package },
        { id: "history", label: "History", icon: Clock },
      ]}
      badge={
        <span className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-right sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">Wallet</span>
          <span className="block font-display text-sm font-bold text-emerald-400">{formatPKR(balance)}</span>
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Wallet balance" value={formatPKR(balance)} accent />
        <Kpi label="Held in escrow for you" value={formatPKR(inEscrow)} sub="Returned in full if delivery fails" />
        <Kpi label="Completed orders" value={history.length} sub={`${active.length} active now`} />
      </div>

      <SectionHeader icon={Package} title="Orders" sub="Protected by escrow until you confirm delivery" id="orders" />
      {orders.length === 0 ? (
        <GlassCard className="text-center">
          <ShoppingBag className="mx-auto mb-2 text-white/20" size={32} />
          <p className="text-sm text-white/40">No orders yet.</p>
          <Link
            to="/store"
            className="mt-3 inline-block rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-emerald-400"
          >
            Shop on Shopping.pk
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {[...orders].reverse().map((o) => (
            <BuyerOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}

      <SectionHeader icon={Clock} title="Order history" sub="Released and refunded orders" id="history" />
      {history.length === 0 ? (
        <GlassCard>
          <p className="py-2 text-center text-sm text-white/30">Completed orders will appear here.</p>
        </GlassCard>
      ) : (
        <GlassCard className="!p-2">
          {[...history].reverse().map((o) => (
            <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-3 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <ProductThumb src={o.productImage} alt={o.productName} className="h-9 w-9" />
                <div>
                  <p className="text-sm font-semibold text-white">
                    {o.id} · {o.productName}
                  </p>
                  <p className="text-[11px] text-white/35">
                    {formatPKR(o.amount)} · {formatSimDate(o.timeline[o.timeline.length - 1].at)}
                  </p>
                </div>
              </div>
              <StatePill state={o.state} tone="dark" />
            </div>
          ))}
        </GlassCard>
      )}
    </DashboardShell>
  );
}
