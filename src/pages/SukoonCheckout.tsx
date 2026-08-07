import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { KeyRound, Lock, ShieldCheck } from "lucide-react";
import { useStore } from "../engine/store";
import { USERS } from "../engine/constants";
import { formatPKR } from "../engine/fees";
import { Card, SukoonLogo } from "../components/ui";
import FeeBreakdown from "../components/FeeBreakdown";

export default function SukoonCheckout() {
  const navigate = useNavigate();
  const { pendingCheckout, pay, login, apiError } = useStore();
  const [step, setStep] = useState<"id" | "2fa" | "summary">("id");
  const [consumerId, setConsumerId] = useState<string>(USERS.buyer.consumerId);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [paying, setPaying] = useState(false);

  if (!pendingCheckout) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-stone-500">
        <p>No checkout in progress.</p>
        <Link to="/store" className="font-semibold text-emerald-700">
          Go to Shopping.pk →
        </Link>
      </div>
    );
  }

  const confirmPay = async () => {
    // The real thing: POST /api/checkout + the mock rail's paid-callback fund
    // escrow in the Java money core before the buyer lands on the dashboard.
    setPaying(true);
    login("buyer");
    const reference = await pay();
    setPaying(false);
    if (reference) navigate("/buyer-dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <SukoonLogo />
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Lock size={12} /> Secure checkout
          </span>
        </div>

        <Card className="!p-6">
          <div className="mb-4 space-y-2 rounded-xl bg-stone-50 p-3">
            {pendingCheckout.items.map((i) => (
              <div key={i.id} className="flex items-center gap-3">
                <img src={i.image} alt={i.name} className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-stone-800">{i.name}</p>
                  <p className="text-xs text-stone-500">Shopping.pk · ×{i.qty}</p>
                </div>
                <p className="text-sm font-bold text-stone-900">{formatPKR(i.qty * i.price)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-stone-200 pt-2">
              <p className="text-xs font-semibold text-stone-500">Total</p>
              <p className="font-bold text-stone-900">{formatPKR(pendingCheckout.amount)}</p>
            </div>
          </div>

          {step === "id" && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => {
                e.preventDefault();
                setStep("2fa");
              }}
              className="space-y-3"
            >
              <label className="block text-sm font-semibold text-stone-700">Sukoon Pay Consumer ID</label>
              <input
                value={consumerId}
                onChange={(e) => setConsumerId(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-emerald-500"
              />
              <p className="text-xs text-stone-400">No card numbers re-entered — your identity is your payment method.</p>
              <button className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
                Continue
              </button>
            </motion.form>
          )}

          {step === "2fa" && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (otp === "000000") setStep("summary");
                else setOtpError(true);
              }}
              className="space-y-3"
            >
              <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                <KeyRound size={14} className="text-emerald-600" /> Two-factor code
              </label>
              <input
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setOtpError(false);
                }}
                maxLength={6}
                className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-center font-mono text-lg tracking-[0.5em] outline-none focus:border-emerald-500"
                placeholder="••••••"
              />
              {otpError && <p className="text-xs font-semibold text-rose-600">Incorrect code — try 000000.</p>}
              <p className="text-xs text-stone-400">
                Code sent to {USERS.buyer.name}&apos;s phone. <span className="font-mono text-emerald-700">(Demo: 000000)</span>
              </p>
              <button className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
                Verify
              </button>
            </motion.form>
          )}

          {step === "summary" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <FeeBreakdown amount={pendingCheckout.amount} />
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-800">
                <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                <span>
                  Your {formatPKR(pendingCheckout.amount)} will be held in trust (<em>Amanah</em>) by Sukoon Pay — not sent to
                  the seller — until delivery is confirmed. If it never arrives or arrives defective, it comes back to you.
                </span>
              </div>
              <button
                onClick={() => void confirmPay()}
                disabled={paying}
                className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 disabled:cursor-wait disabled:opacity-60"
              >
                {paying ? "Holding funds in escrow…" : "Confirm & pay into escrow"}
              </button>
              {apiError && !paying && (
                <p className="text-xs font-semibold text-rose-600">
                  Payment failed: {apiError}. Is the backend running on port 8080?
                </p>
              )}
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}
