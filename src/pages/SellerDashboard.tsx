import { useState } from "react";
import { motion } from "framer-motion";
import { Banknote, Clock, Landmark, PackageOpen, Zap } from "lucide-react";
import { useStore } from "../engine/store";
import type { Order } from "../engine/types";
import { ACCOUNTS, USERS } from "../engine/constants";
import { balanceOf } from "../engine/ledger";
import { formatPKR } from "../engine/fees";
import { formatSimDate, remainingLabel } from "../lib/format";
import { Card, PageShell, StatePill } from "../components/ui";

function SellerOrderRow({ order }: { order: Order }) {
  const { clock, shipOrder } = useStore();
  const canShip = order.state === "HELD_IN_ESCROW";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{order.productImage}</span>
        <div>
          <p className="text-sm font-bold text-stone-800">
            {order.id} · {order.productName}
          </p>
          <p className="text-xs text-stone-500">
            {formatPKR(order.amount)} · placed {formatSimDate(order.timeline[0].at)}
            {order.state === "HELD_IN_ESCROW" && order.noShipDeadline && (
              <span className="ml-2 font-semibold text-amber-600">
                <Clock size={11} className="mr-0.5 inline" />
                ship within {remainingLabel(order.noShipDeadline, clock)} or auto-refund
              </span>
            )}
            {order.state === "INSPECTION_WINDOW" && order.inspectionWindowEndsAt && (
              <span className="ml-2 font-semibold text-violet-600">
                auto-release in {remainingLabel(order.inspectionWindowEndsAt, clock)}
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} />
        {canShip && (
          <button
            onClick={() => shipOrder(order.id, `TCS-${Math.floor(700000 + (order.timeline[0].at % 100000))}`)}
            className="rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-stone-700"
          >
            Mark shipped · attach tracking
          </button>
        )}
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const orders = useStore((s) => s.orders);
  const [withdrawn, setWithdrawn] = useState(false);

  const activeEscrow = orders
    .filter((o) => ["HELD_IN_ESCROW", "SHIPPED", "INSPECTION_WINDOW", "DISPUTED"].includes(o.state))
    .reduce((sum, o) => sum + balanceOf([o], ACCOUNTS.escrow(o.id)), 0);
  const released = balanceOf(orders, ACCOUNTS.sellerWallet);

  return (
    <PageShell title={USERS.seller.name} subtitle="Merchant dashboard — Sukoon Pay attached as a payment method">
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
        <Zap size={16} className="text-emerald-400" />
        Paid on delivery — not in 30 days. Escrowed orders are prepaid: no fake orders, no COD cash stuck with couriers.
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Card className="!border-amber-200 !bg-amber-50">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
            <Landmark size={13} /> In Escrow (pending)
          </p>
          <motion.p
            key={activeEscrow}
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            className="mt-1 text-3xl font-black text-amber-800"
          >
            {formatPKR(activeEscrow)}
          </motion.p>
          <p className="mt-1 text-xs text-amber-700/70">Held in trust by Sukoon Pay — releases on confirmed delivery</p>
        </Card>
        <Card className="!border-emerald-200 !bg-emerald-50">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <Banknote size={13} /> Released (withdrawable)
          </p>
          <motion.p
            key={released}
            initial={{ scale: 1.06 }}
            animate={{ scale: 1 }}
            className="mt-1 text-3xl font-black text-emerald-800"
          >
            {formatPKR(released)}
          </motion.p>
          <button
            onClick={() => setWithdrawn(true)}
            disabled={released <= 0}
            className="mt-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Withdraw to bank
          </button>
          {withdrawn && released > 0 && (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              ✓ Transfer of {formatPKR(released)} to Meezan Bank ····4102 initiated (same-day). [mock]
            </p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="mb-2 flex items-center gap-2 font-bold text-stone-800">
          <PackageOpen size={16} className="text-stone-400" /> Orders
        </h2>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-400">
            No orders yet — when a buyer pays with Sukoon Pay on your store, it appears here instantly.
          </p>
        ) : (
          [...orders].reverse().map((o) => <SellerOrderRow key={o.id} order={o} />)
        )}
      </Card>
    </PageShell>
  );
}
