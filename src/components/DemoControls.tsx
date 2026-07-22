import { useLocation, useNavigate } from "react-router-dom";
import { FastForward, Info, RotateCcw, X } from "lucide-react";
import { useStore } from "../engine/store";
import { SCENARIOS } from "../engine/scenarios";
import { DAY_MS, HOUR_MS } from "../engine/constants";
import { formatSimDate } from "../lib/format";
import type { Role } from "../engine/types";

const ROLES: { role: Role; label: string; path: string }[] = [
  { role: "buyer", label: "Buyer", path: "/buyer" },
  { role: "seller", label: "Seller", path: "/seller" },
  { role: "courier", label: "Courier", path: "/courier" },
  { role: "admin", label: "Admin", path: "/admin" },
];

const JUMPS = [
  { label: "+12h", ms: 12 * HOUR_MS },
  { label: "+1d", ms: DAY_MS },
  { label: "+3d", ms: 3 * DAY_MS },
  { label: "+7d", ms: 7 * DAY_MS },
];

// Public-facing surfaces keep the real-product illusion — no ops bar there.
export const DEMO_BAR_HIDDEN_ROUTES = ["/", "/login", "/signup", "/bazaar"];
const HIDDEN_ROUTES = DEMO_BAR_HIDDEN_ROUTES;

export default function DemoControls() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { clock, currentRole, activeScenario, scenarioHint, advanceClock, loadScenario, dismissHint, resetDemo, login } =
    useStore();

  if (HIDDEN_ROUTES.includes(pathname)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {scenarioHint && (
        <div className="mx-auto mb-2 flex max-w-4xl items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 shadow-lg">
          <Info size={16} className="mt-0.5 shrink-0 text-emerald-600" />
          <span className="flex-1">{scenarioHint}</span>
          <button onClick={dismissHint} className="text-emerald-500 hover:text-emerald-800" aria-label="Dismiss hint">
            <X size={16} />
          </button>
        </div>
      )}
      <div className="border-t border-stone-700 bg-stone-900 text-stone-200">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 text-sm">
          <span className="hidden text-xs font-semibold uppercase tracking-wider text-stone-500 sm:block">Demo controls</span>

          <label className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Scenario</span>
            <select
              value={activeScenario ?? ""}
              onChange={(e) => e.target.value && loadScenario(Number(e.target.value))}
              className="rounded-md border border-stone-600 bg-stone-800 px-2 py-1 text-xs text-stone-100"
            >
              <option value="">— pick a storyline —</option>
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.title} — {s.tagline}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            <span className="mr-1 text-xs text-stone-400">View as</span>
            {ROLES.map(({ role, label, path }) => (
              <button
                key={role}
                onClick={() => {
                  login(role);
                  navigate(path);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  currentRole === role ? "bg-emerald-600 text-white" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <FastForward size={14} className="text-stone-400" />
            <span className="mr-1 font-mono text-xs text-emerald-400">{formatSimDate(clock)}</span>
            {JUMPS.map((j) => (
              <button
                key={j.label}
                onClick={() => advanceClock(j.ms)}
                className="rounded-md bg-stone-800 px-2 py-1 text-xs font-semibold text-stone-300 hover:bg-stone-700"
                title="Fast-forward simulated time"
              >
                {j.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              resetDemo();
              navigate("/");
            }}
            className="ml-auto flex items-center gap-1.5 rounded-md bg-stone-800 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-stone-700"
          >
            <RotateCcw size={12} /> Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}
