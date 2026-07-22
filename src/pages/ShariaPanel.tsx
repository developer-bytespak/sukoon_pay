import { BadgeCheck, Ban, HandCoins, Landmark, Scale, ShieldCheck } from "lucide-react";
import { PRODUCT } from "../engine/constants";
import { Card, PageShell } from "../components/ui";
import FeeBreakdown from "../components/FeeBreakdown";

const CONTRACTS = [
  {
    icon: Landmark,
    arabic: "Wadiah yad Amanah",
    title: "Holding the money — trust-based safekeeping",
    text: "Sukoon Pay holds the buyer's funds in trust. We do not own them and do not use them. The buyer's money is returnable — liability only for negligence.",
  },
  {
    icon: HandCoins,
    arabic: "Wakala · AAOIFI Standard No. 23",
    title: "Acting for the parties — compensated agency",
    text: "Sukoon Pay is the wakeel (agent) of buyer and seller, performing the service of holding, verifying delivery, and releasing. The standard explicitly permits a compensated agency.",
  },
  {
    icon: BadgeCheck,
    arabic: "Ujrah",
    title: "Our compensation — a fee for service",
    text: "A known, fixed, capped fee agreed in advance — clearly a price for service, never a return on money.",
  },
];

const GUARDRAILS = [
  { avoid: "Interest on held balances (riba)", instead: "Nothing is ever added to held funds" },
  { avoid: "Investing escrow float in T-bills / interest deposits", instead: "Trust funds are never invested; any future float structure needs explicit SSB sign-off" },
  { avoid: "“Sole discretion” dispute terms (gharar)", instead: "Published, deterministic dispute rules — both parties can predict the outcome" },
  { avoid: "Penalties kept as profit", instead: "Adjudication is a fixed service fee; any inadvertent non-halal income goes to the purification (charity) account" },
  { avoid: "Processing for haram merchants", instead: "Merchant category screening" },
];

export default function ShariaPanel() {
  return (
    <PageShell
      title="Sharia compliance — the foundation"
      subtitle="Not a feature bolted on: the contract structure the product is built from"
      badge={
        <span className="flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
          <ShieldCheck size={16} /> Halal by design · Wakala + Amanah
        </span>
      }
    >
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {CONTRACTS.map((c) => (
          <Card key={c.arabic}>
            <c.icon className="mb-2 text-emerald-600" size={22} />
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">{c.arabic}</p>
            <h3 className="mt-1 font-bold text-stone-900">{c.title}</h3>
            <p className="mt-1 text-sm text-stone-500">{c.text}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-600 p-6 text-white">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Scale size={20} /> Buyer protection is NOT insurance
        </h3>
        <p className="mt-2 text-sm text-emerald-50">
          We return your own money from trust — <strong>no premium, no pool, no risk transfer</strong>. Insurance pays out
          from a pooled premium; Sukoon Pay simply gives back the buyer&apos;s own funds held under <em>yad amanah</em> if
          delivery fails. No wager, no gharar, no maysir — the objection dissolves.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 flex items-center gap-2 font-bold text-stone-900">
            <Ban size={16} className="text-rose-500" /> What we avoid — and what we do instead
          </h3>
          <div className="space-y-2.5">
            {GUARDRAILS.map((g) => (
              <div key={g.avoid} className="rounded-lg bg-stone-50 p-3 text-xs">
                <p className="font-semibold text-rose-700">✗ {g.avoid}</p>
                <p className="mt-0.5 text-emerald-700">✓ {g.instead}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-bold text-stone-900">Live fee breakdown — sample transaction</h3>
          <p className="mb-3 text-xs text-stone-500">
            {PRODUCT.name} · Bazaar.pk · the fee schedule is tiered and <strong>capped at PKR 400</strong> — on a PKR 200,000
            order a 2.9% gateway would charge ~PKR 5,800; Sukoon Pay charges PKR 400.
          </p>
          <FeeBreakdown amount={PRODUCT.price} />
          <div className="mt-4 rounded-lg border border-stone-200 p-3 text-xs text-stone-500">
            <p className="font-bold text-stone-700">Tiered Wakala fee schedule</p>
            <table className="mt-1.5 w-full">
              <tbody>
                {[
                  ["≤ PKR 5,000", "PKR 25"],
                  ["PKR 5,000 – 25,000", "PKR 75"],
                  ["PKR 25,000 – 100,000", "PKR 200"],
                  ["> PKR 100,000", "PKR 400 (capped)"],
                ].map(([tier, fee]) => (
                  <tr key={tier} className="border-t border-stone-100">
                    <td className="py-1">{tier}</td>
                    <td className="py-1 text-right font-semibold text-stone-700">{fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-stone-400">
            Governance: Shariah Supervisory Board certification, internal compliance officer, periodic Shariah audit, and a
            purification account for any inadvertent non-halal income.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
