import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Clock, MessageCircle, PackageOpen, ShoppingCart, Zap } from "lucide-react";
import { useStore } from "../../engine/store";
import type { Order } from "../../engine/types";
import { ACCOUNTS, USERS } from "../../engine/constants";
import { balanceOf } from "../../engine/ledger";
import { formatPKR } from "../../engine/fees";
import { agoLabel, formatSimDate, remainingLabel } from "../../lib/format";
import { ProductThumb, StatePill } from "../../components/ui";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { GlassCard, Kpi, SectionHeader } from "../../components/dashboard/ui";
import IntegrationsSection from "../../components/dashboard/IntegrationsSection";

function SellerOrderRow({ order }: { order: Order }) {
  const { clock, shipOrder } = useStore();
  const canShip = order.state === "HELD_IN_ESCROW";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-3 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <ProductThumb src={order.productImage} alt={order.productName} className="h-10 w-10" />
        <div>
          <p className="text-sm font-bold text-white">
            {order.id} · {order.productName}
          </p>
          <p className="text-xs text-white/40">
            {formatPKR(order.amount)} · placed {formatSimDate(order.timeline[0].at)}
            {order.state === "HELD_IN_ESCROW" && order.noShipDeadline && (
              <span className="ml-2 font-semibold text-amber-300">
                <Clock size={11} className="mr-0.5 inline" />
                ship within {remainingLabel(order.noShipDeadline, clock)} or auto-refund
              </span>
            )}
            {order.state === "INSPECTION_WINDOW" && order.inspectionWindowEndsAt && (
              <span className="ml-2 font-semibold text-violet-300">
                auto-release in {remainingLabel(order.inspectionWindowEndsAt, clock)}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} tone="dark" />
        {canShip && (
          <button
            onClick={() => shipOrder(order.id, `TCS-${Math.floor(700000 + (order.timeline[0].at % 100000))}`)}
            className="rounded-lg bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/15"
          >
            Mark shipped · attach tracking
          </button>
        )}
      </div>
    </div>
  );
}

function PendingCartsSection() {
  const { pendingCarts = [], integrations, clock, nudgeCart, webhookEvents = [] } = useStore();
  const connected = integrations.carts.connected;
  const missed = webhookEvents.filter((e) => e.type === "carts" && e.status === "skipped_not_connected" && !e.test).length;
  const open = pendingCarts.filter((c) => c.status !== "recovered");

  return (
    <>
      <SectionHeader
        icon={ShoppingCart}
        title="Pending carts"
        sub="Customers who added to cart but never paid. Streamed in by the pending carts webhook."
        id="carts"
      />
      {!connected ? (
        <GlassCard className="text-center">
          <ShoppingCart className="mx-auto mb-2 text-white/20" size={30} />
          <p className="text-sm font-semibold text-white/70">The pending carts webhook is not connected.</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-white/40">
            {missed > 0
              ? `${missed} abandoned ${missed === 1 ? "cart has" : "carts have"} already slipped past this dashboard. Connect the webhook below to start capturing them.`
              : "Connect it below to see every cart your customers abandon, and win the sale back."}
          </p>
          <a
            href="#integrations"
            className="mt-3 inline-block rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-bold text-stone-950 transition hover:bg-teal-400"
          >
            Set up in Integrations
          </a>
        </GlassCard>
      ) : pendingCarts.length === 0 ? (
        <GlassCard>
          <p className="py-3 text-center text-sm text-white/30">
            Connected and listening. Abandoned carts from your store will appear here.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="!p-2">
          {pendingCarts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-3 py-3 last:border-0">
              <div className="flex items-center gap-3">
                <ProductThumb src={c.items[0]?.image ?? ""} alt={c.items[0]?.name ?? ""} className="h-10 w-10" />
                <div>
                  <p className="text-sm font-bold text-white">
                    {c.id} · {c.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                  </p>
                  <p className="text-xs text-white/40">
                    {c.customerMasked} · {formatPKR(c.value)} · abandoned {agoLabel(Math.max(0, clock - c.createdAt))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.status === "recovered" ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    ✓ Recovered
                  </span>
                ) : c.status === "nudged" ? (
                  <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                    Nudge sent
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    Open
                  </span>
                )}
                {c.status === "open" && (
                  <button
                    onClick={() => nudgeCart(c.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/15"
                  >
                    <MessageCircle size={12} /> Send WhatsApp nudge
                  </button>
                )}
              </div>
            </div>
          ))}
        </GlassCard>
      )}
      {connected && open.length > 0 && (
        <p className="mt-2 text-[11px] text-white/30">
          Real cart-recovery plugins fire after a cutoff (about 15 minutes). The demo fires immediately so cause and effect
          stay visible.
        </p>
      )}
    </>
  );
}

export default function SellerDashboard() {
  const orders = useStore((s) => s.orders ?? []);
  const pendingCarts = useStore((s) => s.pendingCarts ?? []);
  const requestPayout = useStore((s) => s.requestPayout);
  const [withdrawn, setWithdrawn] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const activeEscrow = orders
    .filter((o) => ["HELD_IN_ESCROW", "SHIPPED", "INSPECTION_WINDOW", "DISPUTED"].includes(o.state))
    .reduce((sum, o) => sum + balanceOf([o], ACCOUNTS.escrow(o.id)), 0);
  const released = balanceOf(orders, ACCOUNTS.sellerWallet);
  const openCarts = pendingCarts.filter((c) => c.status !== "recovered");
  const openCartsValue = openCarts.reduce((sum, c) => sum + c.value, 0);

  return (
    <DashboardShell
      role="seller"
      title={USERS.seller.name}
      subtitle="Merchant dashboard. Sukoon Pay attached as a payment method."
      nav={[
        { id: "orders", label: "Orders", icon: PackageOpen },
        { id: "carts", label: "Pending carts", icon: ShoppingCart },
        { id: "integrations", label: "Integrations", icon: Zap },
      ]}
      badge={
        <span className="hidden rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-right sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">Withdrawable</span>
          <span className="block font-display text-sm font-bold text-teal-300">{formatPKR(released)}</span>
        </span>
      }
    >
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white">
        <Zap size={16} className="text-teal-400" />
        Paid on delivery, not in 30 days. Escrowed orders are prepaid: no fake orders, no COD cash stuck with couriers.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="In escrow (pending)" value={<motion.span key={activeEscrow} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="inline-block">{formatPKR(activeEscrow)}</motion.span>} sub="Releases on confirmed delivery" />
        <Kpi label="Released (withdrawable)" value={<motion.span key={released} initial={{ scale: 1.05 }} animate={{ scale: 1 }} className="inline-block">{formatPKR(released)}</motion.span>} accent />
        <Kpi label="Orders" value={orders.length} sub="via Sukoon Pay checkout" />
        <Kpi label="Pending carts" value={openCarts.length} sub={openCarts.length > 0 ? `${formatPKR(openCartsValue)} recoverable` : "none open"} />
      </div>

      <div className="mt-3">
        <GlassCard className="flex flex-wrap items-center justify-between gap-3 !py-4">
          <div className="flex items-center gap-2.5">
            <Banknote size={18} className="text-teal-400" />
            <div>
              <p className="text-sm font-bold text-white">Payouts</p>
              <p className="text-xs text-white/40">Same-day transfer to Meezan Bank ····4102</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {withdrawn && (
              <p className="text-xs font-semibold text-emerald-300">✓ Payout initiated via the payment rail</p>
            )}
            <button
              onClick={async () => {
                // A real payout: the ledger debits the seller pool + trust bank,
                // then the (mock) rail carries it out — idempotent, verified IBAN.
                setWithdrawing(true);
                const ok = await requestPayout(released);
                setWithdrawing(false);
                if (ok) setWithdrawn(true);
              }}
              disabled={released <= 0 || withdrawing}
              className="rounded-lg bg-teal-500 px-4 py-2 text-xs font-bold text-stone-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {withdrawing ? "Transferring…" : "Withdraw to bank"}
            </button>
          </div>
        </GlassCard>
      </div>

      <SectionHeader icon={PackageOpen} title="Orders" sub="Escrow status per order, with shipping deadlines" id="orders" />
      {orders.length === 0 ? (
        <GlassCard>
          <p className="py-3 text-center text-sm text-white/30">
            No orders yet. When a buyer pays with Sukoon Pay on your store, it appears here instantly.
          </p>
        </GlassCard>
      ) : (
        <GlassCard className="!p-2">
          {[...orders].reverse().map((o) => (
            <SellerOrderRow key={o.id} order={o} />
          ))}
        </GlassCard>
      )}

      <PendingCartsSection />

      <IntegrationsSection />
    </DashboardShell>
  );
}
