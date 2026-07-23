import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, KeyRound, MapPin, Scale, ShieldCheck, Store, Truck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "../engine/store";
import type { Role } from "../engine/types";
import { ROLE_CONFIGS } from "../components/dashboard/roles";
import { darkInputCls } from "../components/dashboard/ui";

const ROLE_COPY: Record<Role, { headline: string; features: { icon: LucideIcon; text: string }[] }> = {
  buyer: {
    headline: "Shop online without the fear.",
    features: [
      { icon: ShieldCheck, text: "Your money is held in trust (Amanah) until you confirm delivery" },
      { icon: MapPin, text: "Releases verified against courier GPS and photo proof" },
      { icon: Zap, text: "Instant refunds from your own held funds if delivery fails" },
    ],
  },
  seller: {
    headline: "Get paid the day you deliver.",
    features: [
      { icon: Zap, text: "Same-day settlement on proof of delivery, T+0" },
      { icon: Store, text: "Escrowed orders are prepaid: no fake orders, no RTO burn" },
      { icon: ShieldCheck, text: "Webhooks for checkout payments and pending carts" },
    ],
  },
  courier: {
    headline: "The partner ops console.",
    features: [
      { icon: Truck, text: "Assigned shipments with live status steppers" },
      { icon: MapPin, text: "Proof of delivery capture: photo, OTP, signature, GPS" },
      { icon: ShieldCheck, text: "Weak proof is flagged, never silently trusted" },
    ],
  },
  admin: {
    headline: "The escrow, made visible.",
    features: [
      { icon: Scale, text: "Dispute adjudication with published rules and four-eyes approval" },
      { icon: ShieldCheck, text: "Segregated trust account totals, never invested" },
      { icon: Zap, text: "Double-entry ledger with a purification account" },
    ],
  },
};

function LoginForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const cfg = ROLE_CONFIGS[role];
  const needs2fa = role === "buyer";
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  const finish = () => {
    login(role);
    navigate(cfg.dashboardPath);
  };

  if (step === "credentials") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (needs2fa) setStep("2fa");
          else finish();
        }}
        className="space-y-4"
      >
        <input className={darkInputCls} placeholder={role === "buyer" ? "Email or Consumer ID" : "Work email"} />
        <input type="password" className={darkInputCls} placeholder="Password" />
        <button className={`w-full rounded-xl py-3 text-sm font-bold shadow-lg transition ${cfg.accentSolid}`}>
          {needs2fa ? "Continue" : "Log in"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (otp === "000000") finish();
        else setOtpError(true);
      }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2 text-white">
        <KeyRound size={16} className="text-emerald-400" />
        <p className="text-sm font-semibold">Two-factor verification</p>
      </div>
      <p className="text-xs text-white/40">
        Enter the 6-digit code sent to your phone. <span className="font-mono text-emerald-400">Demo code: 000000</span>
      </p>
      <input
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value);
          setOtpError(false);
        }}
        maxLength={6}
        className={`${darkInputCls} text-center font-mono text-lg tracking-[0.5em]`}
        placeholder="••••••"
      />
      {otpError && <p className="text-xs font-semibold text-rose-400">Incorrect code. Try 000000.</p>}
      <button className={`w-full rounded-xl py-3 text-sm font-bold shadow-lg transition ${cfg.accentSolid}`}>
        Verify &amp; log in
      </button>
    </form>
  );
}

function SignupForm({ role }: { role: Role }) {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const cfg = ROLE_CONFIGS[role];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login(role);
        navigate(cfg.dashboardPath);
      }}
      className="space-y-4"
    >
      <input className={darkInputCls} placeholder={role === "seller" ? "Store name" : "Full name"} />
      <input className={darkInputCls} placeholder="Email" />
      <input type="password" className={darkInputCls} placeholder="Password" />
      {role === "seller" && <input className={darkInputCls} placeholder="Store URL (Shopify, WooCommerce or custom)" />}
      <button className={`w-full rounded-xl py-3 text-sm font-bold shadow-lg transition ${cfg.accentSolid}`}>
        Create {cfg.label.toLowerCase()} account
      </button>
    </form>
  );
}

export default function RoleAuth({ role }: { role: Role }) {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const cfg = ROLE_CONFIGS[role];
  const copy = ROLE_COPY[role];
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className="grid min-h-screen bg-stone-950 lg:grid-cols-2">
      {/* image panel */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src="/img/hero-bg.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-stone-950/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/30 to-stone-950/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-stone-950/70" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">س</span>
            <span className="font-display text-xl font-bold text-white">
              Sukoon <span className="text-emerald-400">Pay</span>
            </span>
          </Link>
          <div>
            <span className={`mb-4 inline-block rounded-full border px-3 py-1 text-xs font-bold ${cfg.accentChip}`}>
              {cfg.label} portal
            </span>
            <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-white">{copy.headline}</h2>
            <div className="mt-8 space-y-3">
              {copy.features.map((f) => (
                <p key={f.text} className="flex items-center gap-2.5 text-sm text-white/70">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                    <f.icon size={14} />
                  </span>
                  {f.text}
                </p>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/30">سکون · peace of mind · demonstration prototype, fake money</p>
        </div>
      </div>

      {/* form panel */}
      <div className="relative flex items-center justify-center overflow-hidden px-6 py-12">
        <div className="aurora-blob animate-aurora-b right-[-20%] top-[-10%] h-[24rem] w-[24rem] bg-emerald-600/25" />

        <div className="relative w-full max-w-md">
          <Link to="/login" className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-white/40 transition hover:text-white">
            <ArrowLeft size={13} /> All portals
          </Link>

          <div className="mb-1 flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-base font-bold text-white">س</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.accentChip}`}>{cfg.label} portal</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-white">
            {mode === "login" ? `${cfg.label} log in` : `Create your ${cfg.label.toLowerCase()} account`}
          </h1>
          <p className="mt-1.5 text-sm text-white/40">{cfg.portalTagline}</p>

          {cfg.hasSignup ? (
            <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
              {(["login", "signup"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${
                    mode === m ? "bg-emerald-500 text-stone-950" : "text-white/50 hover:text-white"
                  }`}
                >
                  {m === "login" ? "Log in" : "Sign up"}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-7 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-white/40">
              {cfg.label} accounts are provisioned by Sukoon Pay. Log in with your issued credentials.
            </p>
          )}

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -14 : 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 14 : -14 }}
                transition={{ duration: 0.2 }}
              >
                {mode === "login" ? <LoginForm role={role} /> : <SignupForm role={role} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <button
              data-testid="quick-demo-login"
              onClick={() => {
                login(role);
                navigate(cfg.dashboardPath);
              }}
              className="w-full rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/15"
            >
              Quick demo login as {cfg.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
