import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Scale, ShoppingBag, Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "../engine/types";
import { ROLE_CONFIGS } from "../components/dashboard/roles";

const ICONS: Record<Role, LucideIcon> = { buyer: ShoppingBag, seller: Store, courier: Truck, admin: Scale };
const ORDER: Role[] = ["buyer", "seller", "courier", "admin"];

export default function PortalChooser() {
  return (
    <div className="noise relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-stone-950 px-6 py-16">
      <div className="aurora-blob animate-aurora-a left-[10%] top-[-20%] h-[30rem] w-[30rem] bg-emerald-600/25" />
      <div className="aurora-blob animate-aurora-c bottom-[-25%] right-[5%] h-[26rem] w-[26rem] bg-teal-600/20" />
      <div className="bg-grid-dark absolute inset-0" />

      <div className="relative w-full max-w-3xl">
        <Link to="/" className="mb-10 flex items-center justify-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-xl font-bold text-white">س</span>
          <span className="font-display text-2xl font-bold text-white">
            Sukoon <span className="text-emerald-400">Pay</span>
          </span>
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center font-display text-4xl font-bold text-white"
        >
          Choose your portal
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-2 text-center text-sm text-white/40"
        >
          One escrow engine, four views. Every side of the transaction has its own home.
        </motion.p>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {ORDER.map((role, i) => {
            const cfg = ROLE_CONFIGS[role];
            const Icon = ICONS[role];
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.07 }}
              >
                <Link
                  to={cfg.authPath}
                  className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition hover:border-emerald-400/40 hover:bg-white/[0.07]"
                >
                  <span className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${cfg.accentChip}`}>
                    <Icon size={20} />
                  </span>
                  <h2 className="font-display text-xl font-bold text-white">{cfg.label}</h2>
                  <p className="mt-1 flex-1 text-sm text-white/45">{cfg.portalTagline}</p>
                  <span className={`mt-4 flex items-center gap-1.5 text-sm font-bold ${cfg.accentText}`}>
                    Open {cfg.label.toLowerCase()} portal
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/25">سکون · peace of mind · demonstration prototype, fake money</p>
      </div>
    </div>
  );
}
