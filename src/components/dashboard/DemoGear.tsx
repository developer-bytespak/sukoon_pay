import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FastForward, Info, RotateCcw, Settings, Store, X } from "lucide-react";
import { useStore } from "../../engine/store";
import { SCENARIOS } from "../../engine/scenarios";
import { DAY_MS, HOUR_MS } from "../../engine/constants";
import { formatSimDate } from "../../lib/format";
import type { Role } from "../../engine/types";
import { ROLE_CONFIGS } from "./roles";

const JUMPS = [
  { label: "+12h", ms: 12 * HOUR_MS, id: "demo-jump-12h" },
  { label: "+1d", ms: DAY_MS, id: "demo-jump-1d" },
  { label: "+3d", ms: 3 * DAY_MS, id: "demo-jump-3d" },
  { label: "+7d", ms: 7 * DAY_MS, id: "demo-jump-7d" },
];

export default function DemoGear() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { clock, activeScenario, scenarioHint, currentRole, advanceClock, loadScenario, resetDemo, login } = useStore();

  return (
    <div className="relative">
      <button
        data-testid="demo-gear"
        onClick={() => setOpen(!open)}
        title="Demo tools"
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
          open ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white"
        }`}
      >
        <Settings size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="demo-panel"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-11 z-50 w-80 rounded-2xl border border-white/10 bg-stone-900/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">Demo tools</p>
              <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white" aria-label="Close demo tools">
                <X size={14} />
              </button>
            </div>

            <label className="mb-3 block">
              <span className="mb-1 block text-xs text-white/45">Scenario storyline</span>
              <select
                data-testid="demo-scenario"
                value={activeScenario ?? ""}
                onChange={(e) => e.target.value && loadScenario(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-stone-800 px-2 py-1.5 text-xs text-white"
              >
                <option value="">— pick a storyline —</option>
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id}. {s.title} — {s.tagline}
                  </option>
                ))}
              </select>
            </label>

            {scenarioHint && (
              <p className="mb-3 flex items-start gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-2 text-[11px] leading-relaxed text-emerald-200">
                <Info size={12} className="mt-0.5 shrink-0" />
                {scenarioHint}
              </p>
            )}

            <div className="mb-3">
              <span className="mb-1 flex items-center gap-1.5 text-xs text-white/45">
                <FastForward size={12} /> Simulated clock ·{" "}
                <span className="font-mono text-emerald-400">{formatSimDate(clock)}</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {JUMPS.map((j) => (
                  <button
                    key={j.label}
                    data-testid={j.id}
                    onClick={() => advanceClock(j.ms)}
                    className="rounded-lg bg-white/[0.06] py-1.5 text-xs font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <span className="mb-1 block text-xs text-white/45">View as</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.keys(ROLE_CONFIGS) as Role[]).map((r) => (
                  <button
                    key={r}
                    data-testid={`demo-role-${r}`}
                    onClick={() => {
                      login(r);
                      navigate(ROLE_CONFIGS[r].dashboardPath);
                    }}
                    className={`rounded-lg py-1.5 text-[11px] font-bold transition ${
                      currentRole === r ? "bg-emerald-500 text-stone-950" : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {ROLE_CONFIGS[r].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button
                onClick={() => navigate("/store")}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/50 transition hover:text-white"
              >
                <Store size={13} /> Open store
              </button>
              <button
                data-testid="demo-reset"
                onClick={() => {
                  resetDemo();
                  navigate("/");
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-rose-300 transition hover:text-rose-200"
              >
                <RotateCcw size={13} /> Reset demo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
