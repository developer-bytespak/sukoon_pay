import { computeWakalaFee, formatPKR } from "../engine/fees";
import { VERIFICATION_FEE } from "../engine/constants";

export default function FeeBreakdown({ amount }: { amount: number }) {
  const wakala = computeWakalaFee(amount);
  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <span className="text-stone-500">Order amount (held in trust — Amanah)</span>
        <span className="font-semibold">{formatPKR(amount)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">Wakala (agency) fee — fixed &amp; capped</span>
        <span className="font-semibold">{formatPKR(wakala)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-stone-500">Delivery-verification fee</span>
        <span className="font-semibold">{formatPKR(VERIFICATION_FEE)}</span>
      </div>
      <div className="flex justify-between border-t border-stone-200 pt-1.5">
        <span className="text-stone-600">Seller receives on release</span>
        <span className="font-bold text-emerald-700">{formatPKR(amount - wakala - VERIFICATION_FEE)}</span>
      </div>
      <p className="pt-1 text-xs text-stone-400">
        You pay the listed price only. Service fees are fixed amounts (never a %), deducted from the seller&apos;s settlement
        at release, and disclosed to both parties in advance.
      </p>
    </div>
  );
}
