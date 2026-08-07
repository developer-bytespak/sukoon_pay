import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Landmark, Scale, ScrollText, UserCheck } from "lucide-react";
import { useStore } from "../../engine/store";
import type { Order } from "../../engine/types";
import { ACCOUNTS, ADJUDICATION_FEE, BUYER_STARTING_BALANCE, USERS } from "../../engine/constants";
import { balanceOf } from "../../engine/ledger";
import { buyerWalletBalance } from "../../engine/api";
import { formatPKR } from "../../engine/fees";
import { StatePill } from "../../components/ui";
import StateMachineDiagram from "../../components/StateMachineDiagram";
import LedgerTable from "../../components/LedgerTable";
import OrderTimeline from "../../components/OrderTimeline";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { GlassCard, Kpi, SectionHeader } from "../../components/dashboard/ui";

function DisputeCard({ order }: { order: Order }) {
  const approveResolution = useStore((s) => s.approveResolution);
  const d = order.dispute!;
  const approvedBy = (id: string) => d.approvals.some((a) => a.adminId === id);

  return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.05] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-bold text-white">
          {order.id} · {order.productName} · {formatPKR(order.amount)}
        </p>
        <span className="rounded-full bg-rose-400/15 px-2.5 py-0.5 text-xs font-bold text-rose-300">
          {d.reason === "not_received" ? "Non-receipt claim" : "Defective / SNAD"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-lg bg-white/[0.04] p-2.5">
          <p className="font-bold text-white/40">Buyer evidence</p>
          <p className="text-white/70">{d.buyerEvidence ?? "None submitted"}</p>
        </div>
        <div className="rounded-lg bg-white/[0.04] p-2.5">
          <p className="font-bold text-white/40">Seller / courier evidence</p>
          <p className="text-white/70">
            {order.courier.proof
              ? `${order.courier.proof.type}: ${order.courier.proof.value} · GPS ${order.courier.proof.gpsMatch ? "✓" : "✗"}`
              : "No proof of delivery on file"}
          </p>
        </div>
        <div className="rounded-lg bg-white/[0.04] p-2.5">
          <p className="font-bold text-white/40">Published rule applied</p>
          <p className="text-white/70">{d.ruleApplied}</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-white/45">
        Deterministic outcome:{" "}
        <span className="font-bold text-white">{d.suggestedResolution === "refund" ? "Refund to buyer" : "Release to seller"}</span> ·
        Adjudication service fee {formatPKR(ADJUDICATION_FEE)} allocated to the party at fault (a service charge, never a
        penalty).
      </p>

      {d.resolution ? (
        <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
          ✓ Resolved: {d.resolution === "refund" ? "refunded to buyer" : "released to seller"}. Approved by{" "}
          {d.approvals.map((a) => a.adminName).join(" and ")}.
        </p>
      ) : (
        <div className="mt-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-white/60">
            <UserCheck size={13} /> Four-eyes approval. Money moves only after two distinct approvers ({d.approvals.length}/2).
          </p>
          <div className="flex flex-wrap gap-2">
            {[USERS.adminA, USERS.adminB].map((admin) => (
              <button
                key={admin.id}
                disabled={approvedBy(admin.id)}
                onClick={() => approveResolution(order.id, admin.id, admin.name)}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                  approvedBy(admin.id)
                    ? "cursor-not-allowed border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                    : "bg-white/10 text-white hover:bg-white/15"
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
    <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
      <p className="flex items-center gap-1.5 text-sm font-bold text-amber-300">
        <AlertTriangle size={15} /> {order.id} · “Delivered” with suspicious proof
      </p>
      <p className="mt-1 text-xs text-amber-200/70">
        {order.courier.proof
          ? `Proof: ${order.courier.proof.type} (${order.courier.proof.value}) · GPS match: ${order.courier.proof.gpsMatch ? "yes" : "NO"}`
          : "No proof supplied."}{" "}
        Funds stay held. We do not naively trust the courier.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => clearFlag(order.id)}
          className="rounded-lg bg-emerald-500 px-3.5 py-2 text-xs font-bold text-stone-950 transition hover:bg-emerald-400"
        >
          Accept proof → open inspection window
        </button>
        <button
          onClick={() => refundFlagged(order.id)}
          className="rounded-lg bg-rose-500 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-rose-400"
        >
          Reject proof → refund buyer
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const orders = useStore((s) => s.orders ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalInTrust = orders.reduce((sum, o) => sum + balanceOf([o], ACCOUNTS.escrow(o.id)), 0);
  const selected = orders.find((o) => o.id === selectedId) ?? orders[orders.length - 1] ?? null;
  const disputes = orders.filter((o) => o.dispute);
  const openDisputes = disputes.filter((o) => !o.dispute?.resolution);
  const flagged = orders.filter((o) => o.courier.flaggedForReview);
  const releasedTotal = balanceOf(orders, ACCOUNTS.sellerWallet);

  const accounts = [
    { name: "platform_fee", balance: balanceOf(orders, ACCOUNTS.platformFee), note: "Wakala + verification fees earned" },
    { name: "purification", balance: balanceOf(orders, ACCOUNTS.purification), note: "Charity account for any non-halal income" },
    { name: "seller_wallet_pool", balance: releasedTotal, note: "Merchant withdrawable balance" },
    { name: "buyer_wallet", balance: buyerWalletBalance(orders, BUYER_STARTING_BALANCE), note: "Consumer wallet" },
  ];

  return (
    <DashboardShell
      role="admin"
      title="Escrow console"
      subtitle="Sukoon Pay internal. Trust account operations and adjudication."
      nav={[
        { id: "queues", label: "Queues", icon: Scale },
        { id: "accounts", label: "Accounts", icon: Landmark },
        { id: "inspector", label: "Inspector", icon: ScrollText },
      ]}
      badge={
        <span className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">Total held in trust</span>
          <motion.span
            key={totalInTrust}
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            className="block font-display text-sm font-bold text-emerald-300"
          >
            {formatPKR(totalInTrust)}
          </motion.span>
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Total held in trust (Amanah)" value={formatPKR(totalInTrust)} sub="Segregated · never invested" accent />
        <Kpi label="Released to sellers" value={formatPKR(releasedTotal)} />
        <Kpi label="Open disputes" value={openDisputes.length} sub="four-eyes required" />
        <Kpi label="Held for review" value={flagged.length} sub="suspicious courier proof" />
      </div>

      <SectionHeader icon={Scale} title="Adjudication queues" sub="Published rules, four-eyes release. Never sole discretion." id="queues" />
      {flagged.length === 0 && disputes.length === 0 ? (
        <GlassCard>
          <p className="py-2 text-center text-sm text-white/30">No flagged deliveries or disputes right now.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {flagged.map((o) => (
            <FlaggedCard key={o.id} order={o} />
          ))}
          {disputes.map((o) => (
            <DisputeCard key={o.id} order={o} />
          ))}
        </div>
      )}

      <SectionHeader icon={Landmark} title="Trust accounts" sub="Per-order escrow and the chart of accounts" id="accounts" />
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <h3 className="mb-2 text-sm font-bold text-white">Per-order escrow accounts</h3>
          {orders.length === 0 && <p className="py-4 text-center text-xs text-white/30">No escrow accounts open.</p>}
          <div className="space-y-1">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                  selected?.id === o.id ? "bg-emerald-400/10 ring-1 ring-emerald-400/40" : "hover:bg-white/5"
                }`}
              >
                <span className="font-mono font-semibold text-white/70">escrow:{o.id}</span>
                <span className="font-bold text-white">{formatPKR(balanceOf([o], ACCOUNTS.escrow(o.id)))}</span>
              </button>
            ))}
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="mb-2 text-sm font-bold text-white">Chart of accounts</h3>
          <div className="space-y-1.5">
            {accounts.map((a) => (
              <div key={a.name} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
                <div>
                  <p className="font-mono font-semibold text-white/80">{a.name}</p>
                  <p className="text-[10px] text-white/35">{a.note}</p>
                </div>
                <span className="font-bold text-white">{formatPKR(a.balance)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <SectionHeader icon={ScrollText} title="Order inspector" sub="State machine, double-entry ledger and audit trail" id="inspector" />
      <GlassCard>
        {selected ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">
                {selected.id} · {selected.productName} · {formatPKR(selected.amount)}
              </h3>
              <StatePill state={selected.state} flagged={selected.courier.flaggedForReview} tone="dark" />
            </div>
            <StateMachineDiagram order={selected} tone="dark" />
            <h4 className="mb-1 mt-5 text-xs font-bold uppercase tracking-wide text-white/35">
              Double-entry ledger (live from the money core)
            </h4>
            <LedgerTable entries={selected.ledgerEntries} tone="dark" />
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-white/30 transition hover:text-white/60">
                Audit timeline
              </summary>
              <div className="mt-3">
                <OrderTimeline events={selected.timeline} tone="dark" />
              </div>
            </details>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-white/30">Select an order, or create one via the store.</p>
        )}
      </GlassCard>
    </DashboardShell>
  );
}
