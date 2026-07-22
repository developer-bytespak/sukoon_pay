import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, MapPin, ShieldCheck, ShoppingBag, Store, Zap } from "lucide-react";
import { useStore } from "../engine/store";
import type { Role } from "../engine/types";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-emerald-400/60 focus:bg-white/[0.08]";

const DEMO_ROLES: { role: Role; label: string; path: string }[] = [
  { role: "buyer", label: "Buyer", path: "/buyer" },
  { role: "seller", label: "Seller", path: "/seller" },
  { role: "admin", label: "Admin", path: "/admin" },
];

function LeftPanel() {
  return (
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
          <p aria-hidden className="font-display mb-3 text-6xl font-bold text-emerald-400/30">
            سکون
          </p>
          <h2 className="max-w-md font-display text-4xl font-bold leading-tight text-white">
            Peace of mind, built into every payment.
          </h2>
          <div className="mt-8 space-y-3">
            {[
              { icon: ShieldCheck, text: "Money held in trust (Amanah) until you confirm delivery" },
              { icon: MapPin, text: "Releases verified against courier GPS and photo proof" },
              { icon: Zap, text: "Sellers settled the same day, T+0" },
            ].map((f) => (
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
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [step, setStep] = useState<"credentials" | "2fa">("credentials");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);

  if (step === "credentials") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("2fa");
        }}
        className="space-y-4"
      >
        <input className={inputCls} placeholder="Email or Consumer ID" />
        <input type="password" className={inputCls} placeholder="Password" />
        <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
          Continue
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (otp === "000000") {
          login("buyer");
          navigate("/buyer");
        } else setOtpError(true);
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
        className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`}
        placeholder="••••••"
      />
      {otpError && <p className="text-xs font-semibold text-rose-400">Incorrect code. Try 000000.</p>}
      <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
        Verify &amp; log in
      </button>
    </form>
  );
}

function SignupForm() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        login(role);
        navigate(role === "buyer" ? "/buyer" : "/seller");
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2.5">
        {(
          [
            { value: "buyer", label: "I'm a Buyer", icon: ShoppingBag, note: "Shop with protection" },
            { value: "seller", label: "I'm a Seller", icon: Store, note: "Get paid same-day" },
          ] as const
        ).map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => setRole(opt.value)}
            className={`rounded-xl border p-4 text-left transition ${
              role === opt.value
                ? "border-emerald-400/60 bg-emerald-400/10"
                : "border-white/10 bg-white/[0.03] hover:border-white/25"
            }`}
          >
            <opt.icon size={18} className={role === opt.value ? "text-emerald-400" : "text-white/40"} />
            <p className="mt-2 text-sm font-bold text-white">{opt.label}</p>
            <p className="text-xs text-white/40">{opt.note}</p>
          </button>
        ))}
      </div>
      <input className={inputCls} placeholder="Full name" />
      <input className={inputCls} placeholder="Email" />
      <input type="password" className={inputCls} placeholder="Password" />
      <button className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-stone-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400">
        Create account
      </button>
    </form>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const login = useStore((s) => s.login);
  const mode: "login" | "signup" = pathname === "/signup" ? "signup" : "login";

  return (
    <div className="grid min-h-screen bg-stone-950 lg:grid-cols-2">
      <LeftPanel />

      <div className="relative flex items-center justify-center overflow-hidden px-6 py-12">
        <div className="aurora-blob animate-aurora-b right-[-20%] top-[-10%] h-[24rem] w-[24rem] bg-emerald-600/25" />

        <div className="relative w-full max-w-md">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg font-bold text-white">س</span>
            <span className="font-display text-xl font-bold text-white">
              Sukoon <span className="text-emerald-400">Pay</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1.5 text-sm text-white/40">
            {mode === "login"
              ? "Log in to track orders, balances and releases."
              : "One account for protected shopping or same-day settlement."}
          </p>

          {/* login / signup toggle */}
          <div className="mt-7 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => navigate(m === "login" ? "/login" : "/signup", { replace: true })}
                className={`rounded-xl py-2.5 text-sm font-bold transition ${
                  mode === m ? "bg-emerald-500 text-stone-950" : "text-white/50 hover:text-white"
                }`}
              >
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === "login" ? -14 : 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 14 : -14 }}
                transition={{ duration: 0.22 }}
              >
                {mode === "login" ? <LoginForm /> : <SignupForm />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 border-t border-white/10 pt-5">
            <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.2em] text-white/30">
              Quick launch for demos
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ROLES.map((d) => (
                <button
                  key={d.role}
                  onClick={() => {
                    login(d.role);
                    navigate(d.path);
                  }}
                  className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] py-2.5 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/15"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
