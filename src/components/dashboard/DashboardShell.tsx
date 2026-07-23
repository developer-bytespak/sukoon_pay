import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useStore } from "../../engine/store";
import type { Role } from "../../engine/types";
import { ROLE_CONFIGS } from "./roles";
import DemoGear from "./DemoGear";

interface NavItem {
  id: string; // in-page anchor
  label: string;
  icon: LucideIcon;
}

export default function DashboardShell({
  role,
  title,
  subtitle,
  badge,
  nav = [],
  children,
}: {
  role: Role;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  nav?: NavItem[];
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);
  const cfg = ROLE_CONFIGS[role];

  return (
    <div className="noise relative min-h-screen overflow-x-clip bg-stone-950 text-white">
      <div className="aurora-blob animate-aurora-b right-[-15%] top-[-20%] h-[26rem] w-[26rem] bg-emerald-600/15" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-stone-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-lg font-bold text-white">س</span>
            <span className="hidden font-display text-lg font-bold text-white sm:block">
              Sukoon <span className="text-emerald-400">Pay</span>
            </span>
          </Link>
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cfg.accentChip}`}>{cfg.label}</span>

          {nav.length > 0 && (
            <nav className="order-last flex w-full items-center gap-1 overflow-x-auto pb-0.5 lg:order-none lg:w-auto lg:pb-0">
              {nav.map((n) => (
                <a
                  key={n.id}
                  href={`#${n.id}`}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  <n.icon size={13} />
                  {n.label}
                </a>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {badge}
            <DemoGear />
            <button
              onClick={() => {
                logout();
                navigate(cfg.authPath);
              }}
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/50 transition hover:text-white"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/40">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
