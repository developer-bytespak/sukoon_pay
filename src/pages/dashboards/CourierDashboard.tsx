import { useState } from "react";
import { MapPin, MapPinOff, Package, Truck } from "lucide-react";
import { useStore } from "../../engine/store";
import type { Order, ProofType } from "../../engine/types";
import { formatPKR } from "../../engine/fees";
import { StatePill } from "../../components/ui";
import DashboardShell from "../../components/dashboard/DashboardShell";
import { GlassCard, Kpi, SectionHeader } from "../../components/dashboard/ui";

const STEPS = [
  { status: "picked_up", label: "Picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
] as const;

const PROOF_VALUES: Record<ProofType, string> = {
  photo: "POD-4471.jpg (door-step photo)",
  otp: "OTP 4-1-9-2 confirmed",
  signature: "Signature captured on device",
};

function ShipmentCard({ order }: { order: Order }) {
  const courierUpdate = useStore((s) => s.courierUpdate);
  const [proofType, setProofType] = useState<ProofType>("photo");
  const [gpsMatch, setGpsMatch] = useState(true);

  const stepIdx = STEPS.findIndex((s) => s.status === order.courier.status);
  const deliverable = order.state === "SHIPPED" && !order.courier.flaggedForReview;
  const nextStep = deliverable && stepIdx < STEPS.length - 1 ? STEPS[stepIdx + 1] : null;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{order.productImage}</span>
          <div>
            <p className="font-bold text-white">
              {order.id} · {order.productName}
            </p>
            <p className="text-xs text-white/40">
              Tracking {order.courier.trackingId ?? "not assigned"} · COD value: none (prepaid via Sukoon Pay) ·{" "}
              {formatPKR(order.amount)}
            </p>
          </div>
        </div>
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} tone="dark" />
      </div>

      <div className="mt-4 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i <= stepIdx ? "bg-amber-400 text-stone-950" : "bg-white/10 text-white/30"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[10px] font-semibold ${i <= stepIdx ? "text-white/80" : "text-white/30"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < stepIdx ? "bg-amber-400" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>

      {nextStep && nextStep.status !== "delivered" && (
        <button
          onClick={() => courierUpdate(order.id, nextStep.status, null)}
          className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Advance to “{nextStep.label}”
        </button>
      )}

      {nextStep?.status === "delivered" && (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-4">
          <p className="mb-3 text-sm font-bold text-white">Mark delivered. Proof of delivery required.</p>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-white/45">Proof type</span>
              <select
                value={proofType}
                onChange={(e) => setProofType(e.target.value as ProofType)}
                className="rounded-md border border-white/15 bg-stone-800 px-2 py-1.5 text-sm text-white"
              >
                <option value="photo">Photo</option>
                <option value="otp">OTP</option>
                <option value="signature">Signature</option>
              </select>
            </label>
            <button
              onClick={() => setGpsMatch(!gpsMatch)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                gpsMatch
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                  : "border-rose-400/40 bg-rose-400/10 text-rose-300"
              }`}
            >
              {gpsMatch ? <MapPin size={14} /> : <MapPinOff size={14} />}
              GPS match: {gpsMatch ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => courierUpdate(order.id, "delivered", { type: proofType, value: PROOF_VALUES[proofType], gpsMatch })}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-stone-950 transition hover:bg-amber-300"
            >
              Submit “Delivered” + proof
            </button>
          </div>
          <p className="mt-2 text-xs text-white/35">
            Proof with GPS off (or missing) will be flagged by Sukoon Pay and held for review. It will not auto-release.
          </p>
        </div>
      )}

      {order.courier.proof && (
        <p className="mt-3 text-xs text-white/45">
          Proof on file: <span className="font-semibold text-white/70">{order.courier.proof.type}</span> · {order.courier.proof.value} ·
          GPS match:{" "}
          <span className={order.courier.proof.gpsMatch ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
            {order.courier.proof.gpsMatch ? "yes" : "no"}
          </span>
        </p>
      )}
    </GlassCard>
  );
}

export default function CourierDashboard() {
  const orders = useStore((s) => s.orders ?? []);
  const shipments = orders.filter((o) => o.paymentMethod === "sukoon");
  const activeShipments = shipments.filter((o) => o.state === "SHIPPED");
  const delivered = shipments.filter((o) => o.courier.status === "delivered");
  const flagged = shipments.filter((o) => o.courier.flaggedForReview);
  const gpsVerified = delivered.filter((o) => o.courier.proof?.gpsMatch);
  const awaiting = shipments.filter((o) => o.state === "HELD_IN_ESCROW");

  return (
    <DashboardShell
      role="courier"
      title="TCS Express · Ops console"
      subtitle="Partner courier panel. Status updates push live to Sukoon Pay."
      nav={[
        { id: "shipments", label: "Shipments", icon: Truck },
        { id: "queue", label: "Pickup queue", icon: Package },
      ]}
      badge={
        <span className="hidden items-center gap-1.5 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-bold text-red-300 sm:flex">
          <Truck size={13} /> TCS partner
        </span>
      }
    >
      <div className="grid gap-3 sm:grid-cols-4">
        <Kpi label="Active shipments" value={activeShipments.length} accent />
        <Kpi label="Delivered" value={delivered.length} />
        <Kpi
          label="GPS-verified"
          value={delivered.length > 0 ? `${Math.round((gpsVerified.length / delivered.length) * 100)}%` : "0%"}
          sub="of delivered parcels"
        />
        <Kpi label="Flagged for review" value={flagged.length} sub="weak proof of delivery" />
      </div>

      <SectionHeader icon={Truck} title="Shipments" sub="Advance status and capture proof of delivery" id="shipments" />
      {shipments.filter((o) => o.state !== "HELD_IN_ESCROW").length === 0 ? (
        <GlassCard className="text-center">
          <Package className="mx-auto mb-2 text-white/20" size={32} />
          <p className="text-sm text-white/40">No shipments yet. Orders appear here once the seller marks them shipped.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {shipments
            .filter((o) => o.state !== "HELD_IN_ESCROW")
            .map((o) => (
              <ShipmentCard key={o.id} order={o} />
            ))}
        </div>
      )}

      <SectionHeader icon={Package} title="Awaiting seller handover" sub="Paid orders not yet shipped" id="queue" />
      {awaiting.length === 0 ? (
        <GlassCard>
          <p className="py-2 text-center text-sm text-white/30">Nothing waiting for pickup.</p>
        </GlassCard>
      ) : (
        <GlassCard className="!p-2">
          {awaiting.map((o) => (
            <div key={o.id} className="flex items-center justify-between border-b border-white/5 px-3 py-3 text-sm text-white/50 last:border-0">
              <span>
                {o.id} · {o.productName}
              </span>
              <StatePill state={o.state} tone="dark" />
            </div>
          ))}
        </GlassCard>
      )}
    </DashboardShell>
  );
}
