import { useState } from "react";
import { MapPin, MapPinOff, Package, Truck } from "lucide-react";
import { useStore } from "../engine/store";
import type { CourierStatus, Order, ProofType } from "../engine/types";
import { StatePill, Card } from "../components/ui";
import { formatPKR } from "../engine/fees";

const STEPS: { status: CourierStatus; label: string }[] = [
  { status: "picked_up", label: "Picked up" },
  { status: "in_transit", label: "In transit" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{order.productImage}</span>
          <div>
            <p className="font-bold text-slate-800">
              {order.id} · {order.productName}
            </p>
            <p className="text-xs text-slate-500">
              Tracking {order.courier.trackingId ?? "—"} · COD value: none (prepaid via Sukoon Pay) · {formatPKR(order.amount)}
            </p>
          </div>
        </div>
        <StatePill state={order.state} flagged={order.courier.flaggedForReview} />
      </div>

      <div className="mt-4 flex items-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i <= stepIdx ? "bg-red-600 text-white" : "bg-slate-200 text-slate-400"
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-[10px] font-semibold ${i <= stepIdx ? "text-slate-700" : "text-slate-400"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${i < stepIdx ? "bg-red-600" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      {nextStep && nextStep.status !== "delivered" && (
        <button
          onClick={() => courierUpdate(order.id, nextStep.status, null)}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Advance to “{nextStep.label}”
        </button>
      )}

      {nextStep?.status === "delivered" && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-bold text-slate-700">Mark delivered — proof of delivery required</p>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Proof type</span>
              <select
                value={proofType}
                onChange={(e) => setProofType(e.target.value as ProofType)}
                className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="photo">Photo</option>
                <option value="otp">OTP</option>
                <option value="signature">Signature</option>
              </select>
            </label>
            <button
              onClick={() => setGpsMatch(!gpsMatch)}
              className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold ${
                gpsMatch ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-rose-300 bg-rose-50 text-rose-700"
              }`}
            >
              {gpsMatch ? <MapPin size={14} /> : <MapPinOff size={14} />}
              GPS match: {gpsMatch ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => courierUpdate(order.id, "delivered", { type: proofType, value: PROOF_VALUES[proofType], gpsMatch })}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
            >
              Submit “Delivered” + proof
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Proof with GPS off (or missing) will be flagged by Sukoon Pay and held for review — it will not auto-release.
          </p>
        </div>
      )}

      {order.courier.proof && (
        <p className="mt-3 text-xs text-slate-500">
          Proof on file: <span className="font-semibold">{order.courier.proof.type}</span> — {order.courier.proof.value} · GPS
          match: <span className={order.courier.proof.gpsMatch ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>{order.courier.proof.gpsMatch ? "yes" : "no"}</span>
        </p>
      )}
    </Card>
  );
}

export default function CourierPanel() {
  const orders = useStore((s) => s.orders);
  const active = orders.filter((o) => o.paymentMethod === "sukoon");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
            <Truck size={18} />
          </span>
          <div>
            <h1 className="text-lg font-bold">TCS Express · Ops Console</h1>
            <p className="text-xs text-slate-400">Partner courier panel — status updates push live to Sukoon Pay</p>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {active.length === 0 && (
          <Card className="text-center text-sm text-slate-500">
            <Package className="mx-auto mb-2 text-slate-300" size={32} />
            No shipments yet. Create an order via Bazaar.pk, or load a scenario below.
          </Card>
        )}
        {active
          .filter((o) => o.state !== "HELD_IN_ESCROW")
          .map((o) => (
            <ShipmentCard key={o.id} order={o} />
          ))}
        {active
          .filter((o) => o.state === "HELD_IN_ESCROW")
          .map((o) => (
            <Card key={o.id} className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {o.id} · {o.productName} — awaiting seller handover (not yet shipped)
              </span>
              <StatePill state={o.state} />
            </Card>
          ))}
      </div>
    </div>
  );
}
