import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Globe,
  Landmark,
  Lock,
  MapPin,
  PackageCheck,
  Plug,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Store,
  Zap,
} from "lucide-react";
import FadeIn from "../components/landing/FadeIn";
import CountUp from "../components/landing/CountUp";

const COURIERS = ["TCS Express", "Leopards", "M&P", "Trax", "PostEx", "BlueEx", "Swyft", "Rider"];

/* ------------------------------------------------------------------ nav */

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-stone-950/60 px-5 py-3 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-lg font-bold text-white">س</span>
          <span className="font-display text-lg font-bold text-white">
            Sukoon <span className="text-emerald-400">Pay</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-white/60 md:flex">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#why" className="transition hover:text-white">Why escrow</a>
          <a href="/#sharia" className="transition hover:text-white">Sharia &amp; fees</a>
          <a href="/#integrations" className="transition hover:text-white">Integrations</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white">
            Log in
          </Link>
          <Link
            to="/signup"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-stone-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="noise relative flex min-h-screen flex-col overflow-hidden pb-10 pt-44">
      {/* full-bleed backdrop — Sheikh Zayed Grand Mosque at dusk (sukoon = peace of mind) */}
      <div className="absolute inset-0">
        <motion.img
          src="/img/hero-bg.jpg"
          alt=""
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          className="h-full w-full object-cover object-center"
        />
        {/* readability + brand unification overlays */}
        <div className="absolute inset-0 bg-stone-950/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/85 via-stone-950/20 to-stone-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-emerald-950/40" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-7xl"
        >
          Shop without fear.
          <br />
          <span className="text-gradient-emerald">Get paid without waiting.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.18 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60"
        >
          Sukoon Pay holds every payment safely in trust until delivery is proven and the buyer is satisfied. Then the
          seller is settled <span className="font-semibold text-white">the same day</span>. Peace of mind at checkout,
          real cash flow for merchants.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/bazaar"
            className="group flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 font-bold text-stone-950 shadow-xl shadow-emerald-500/30 transition hover:bg-emerald-400"
          >
            <Store size={18} />
            Try the demo store
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#how"
            className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-white/85 backdrop-blur transition hover:bg-white/10"
          >
            See how escrow works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300/90"
        >
          <ShieldCheck size={15} />
          Halal by design · Wakala + Amanah · AAOIFI-aligned
        </motion.div>
      </div>

      {/* courier marquee */}
      <div className="relative mx-auto mt-16 w-full max-w-6xl px-6">
        <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
          Releases verified against partner courier proof
        </p>
        <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="animate-marquee flex w-max gap-12">
            {[...COURIERS, ...COURIERS].map((c, i) => (
              <span key={i} className="whitespace-nowrap font-display text-lg font-semibold text-white/25">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------- how it works */

const STEPS = [
  { icon: CreditCard, title: "Buyer pays", text: "Consumer ID + 2FA at any partner store's checkout. No card numbers re-entered." },
  { icon: Lock, title: "Held in trust", text: "Funds sit with Sukoon Pay as Amanah: not the seller's yet, not spendable, never invested." },
  { icon: PackageCheck, title: "Delivered & verified", text: "A partner courier delivers with proof of photo, OTP and GPS. An inspection window opens." },
  { icon: Zap, title: "Released, T+0", text: "Buyer confirms, or the window closes in silence. Either way the seller is settled same-day." },
];

function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <FadeIn>
        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">The escrow pipeline</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-center font-display text-4xl font-bold text-white">
          Proof of delivery starts a clock. <span className="text-white/40">It never moves money by itself.</span>
        </h2>
      </FadeIn>

      <div className="relative mt-16">
        {/* connector line that draws on scroll */}
        <div className="absolute left-0 right-0 top-7 hidden h-px bg-white/10 lg:block">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="h-full origin-left bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
          />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.12}>
              <div className="group relative">
                <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-stone-950 text-emerald-400 shadow-[0_0_30px_-6px_rgba(52,211,153,0.4)] transition group-hover:scale-105">
                  <s.icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-white">
                  <span className="mr-1.5 text-emerald-400/60">{i + 1}.</span>
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{s.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- stats band */

function Stats() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.02]">
      <img
        src="/img/boxes.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-[0.07] grayscale"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-transparent to-stone-950" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: <CountUp to={80} suffix="%+" />, label: "of Pakistani e-commerce orders are still Cash on Delivery" },
          { value: <>30–45%</>, label: "of COD parcels come back undelivered, and sellers pay shipping both ways" },
          { value: <>3–10 days</>, label: "couriers hold sellers' COD cash before settling it, every order" },
          { value: <>T+0</>, label: "settlement with Sukoon Pay, paid the day delivery is confirmed", accent: true },
        ].map((s, i) => (
          <FadeIn key={i} delay={i * 0.08}>
            <div className={s.accent ? "border-l-2 border-emerald-400 pl-5" : "border-l border-white/10 pl-5"}>
              <p className={`font-display text-4xl font-bold ${s.accent ? "text-emerald-400" : "text-white"}`}>{s.value}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/45">{s.label}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------------------------------- bento grid */

function MiniTracker() {
  const steps = ["Paid", "Shipped", "Delivered", "Inspection", "Released"];
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                  i <= 3 ? "bg-emerald-500 text-stone-950" : "border border-white/20 text-white/30"
                }`}
              >
                {i < 3 ? "✓" : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[9px] font-semibold ${i <= 3 ? "text-white/70" : "text-white/30"}`}>
                {i === 3 ? "6d 22h left" : label}
              </span>
            </div>
            {i < steps.length - 1 && <div className={`mx-1 h-px flex-1 ${i < 3 ? "bg-emerald-500/60" : "bg-white/10"}`} />}
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <span className="rounded-lg bg-emerald-500 px-3 py-1.5 text-[10px] font-bold text-stone-950">Confirm receipt</span>
        <span className="rounded-lg border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-white/60">Report a problem</span>
      </div>
    </div>
  );
}

function FeeBars() {
  return (
    <div className="mt-5 space-y-4">
      {[
        { label: "Typical gateway · 2.9%", amount: "PKR 5,800", width: "100%", cls: "bg-white/15" },
        { label: "Sukoon Pay · capped Wakala fee", amount: "PKR 400", width: "9%", cls: "bg-emerald-400" },
      ].map((b) => (
        <div key={b.label}>
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-medium text-white/50">{b.label}</span>
            <span className="font-display font-bold text-white">{b.amount}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: b.width }}
              viewport={{ once: true }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className={`h-full rounded-full ${b.cls}`}
            />
          </div>
        </div>
      ))}
      <p className="text-[11px] text-white/35">On a PKR 200,000 order. A fixed price for a service, never a percentage of your money.</p>
    </div>
  );
}

function Bento() {
  const cell = "rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:border-emerald-400/30 hover:bg-white/[0.06]";
  return (
    <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <FadeIn>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">One escrow layer</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold text-white">
          Every side of the transaction, <span className="text-white/40">covered by the same held rupee.</span>
        </h2>
      </FadeIn>

      <div className="mt-12 grid gap-4 lg:grid-cols-12">
        {/* buyer protection — large */}
        <FadeIn className="lg:col-span-7">
          <div className={`${cell} h-full`}>
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Differentiator 01</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-white">Buyer protection through escrow</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
              The buyer pays upfront but the money is <em>held, not handed over</em>. Never arrived? Arrived defective?
              Their own funds return from trust. That is protection COD can&apos;t give.
            </p>
            <div className="mt-6">
              <MiniTracker />
            </div>
          </div>
        </FadeIn>

        {/* instant settlement + fee comparison */}
        <FadeIn delay={0.1} className="lg:col-span-5">
          <div className={`${cell} h-full`}>
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">Differentiator 02</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold text-white">Paid on delivery, not in 30 days</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Proof of delivery plus buyer confirmation settles the seller the same day, and the capped fee undercuts
              every percentage gateway.
            </p>
            <FeeBars />
          </div>
        </FadeIn>

        {/* courier-verified — photo cell */}
        <FadeIn className="lg:col-span-4">
          <div className="group relative h-full min-h-[15rem] overflow-hidden rounded-3xl border border-white/10">
            <img
              src="/img/rider.jpg"
              alt="Delivery rider"
              className="absolute inset-0 h-full w-full object-cover grayscale transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-emerald-950/80 to-emerald-900/40 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />
            <div className="relative flex h-full flex-col justify-end p-6">
              <MapPin size={18} className="mb-2 text-emerald-400" />
              <h3 className="font-display text-xl font-bold text-white">Courier-verified, never courier-trusted</h3>
              <p className="mt-1.5 text-sm text-white/60">
                “Delivered” with no GPS match or photo doesn&apos;t release a rupee. It flags the order for review.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* deterministic disputes */}
        <FadeIn delay={0.08} className="lg:col-span-4">
          <div className={`${cell} h-full`}>
            <Scale size={18} className="text-emerald-400" />
            <h3 className="mt-3 font-display text-xl font-bold text-white">Disputes with published rules</h3>
            <p className="mt-1.5 text-sm text-white/50">No “sole discretion”. Both parties can predict the outcome.</p>
            <div className="mt-4 space-y-2 font-mono text-[11px]">
              {[
                ["R1", "strong proof → release"],
                ["R2", "weak proof → refund buyer"],
                ["R3", "defect + evidence → refund"],
              ].map(([r, t]) => (
                <div key={r} className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2">
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 font-bold text-emerald-300">{r}</span>
                  <span className="text-white/55">{t}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-white/35">Money moves only after two approvers sign. Four-eyes, always.</p>
          </div>
        </FadeIn>

        {/* ledger + sharia */}
        <FadeIn delay={0.16} className="lg:col-span-4">
          <div className={`${cell} flex h-full flex-col`}>
            <Landmark size={18} className="text-emerald-400" />
            <h3 className="mt-3 font-display text-xl font-bold text-white">A ledger you can watch</h3>
            <p className="mt-1.5 text-sm text-white/50">
              Every rupee lives in a segregated trust account with a double-entry trail, including a purification
              account for anything non-halal.
            </p>
            <div className="mt-4 rounded-xl bg-black/30 p-3 font-mono text-[11px]">
              <div className="flex justify-between py-0.5"><span className="text-white/50">escrow:SP-10294</span><span className="text-rose-400">DR 4,944</span></div>
              <div className="flex justify-between py-0.5"><span className="text-white/50">seller_wallet</span><span className="text-emerald-400">CR 4,944</span></div>
              <div className="flex justify-between py-0.5"><span className="text-white/50">purification</span><span className="text-white/30">0</span></div>
            </div>
            <Link to="/admin" className="mt-auto pt-4 text-xs font-semibold text-emerald-400 transition hover:text-emerald-300">
              Open the escrow console →
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ sharia */

function Sharia() {
  return (
    <section id="sharia" className="bg-girih relative overflow-hidden border-y border-white/10 bg-emerald-950/40">
      <div className="mx-auto max-w-6xl px-6 py-28">
        <FadeIn>
          <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">☪ Sharia by construction</p>
          <h2 className="mx-auto mt-3 max-w-3xl text-center font-display text-4xl font-bold text-white">
            Not a compliance sticker. <span className="text-white/40">The contract structure itself.</span>
          </h2>
        </FadeIn>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {[
            { ar: "Amanah", en: "Trust-based safekeeping", text: "We hold the buyer's funds without owning or using them. Returnable, uninvested, liable only for negligence." },
            { ar: "Wakala", en: "Compensated agency · AAOIFI No. 23", text: "Sukoon Pay acts as the agent of both parties: holding, verifying delivery, releasing." },
            { ar: "Ujrah", en: "A fee for service", text: "Known, fixed, capped, agreed in advance. A price for work, never a return on money." },
          ].map((c, i) => (
            <FadeIn key={c.ar} delay={i * 0.1}>
              <div className="h-full rounded-3xl border border-emerald-400/15 bg-white/[0.04] p-6 backdrop-blur">
                <p className="font-display text-3xl font-bold text-gradient-emerald">{c.ar}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/40">{c.en}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{c.text}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.15}>
          <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-emerald-400/25 bg-emerald-400/[0.07] p-8 text-center">
            <BadgeCheck className="mx-auto mb-3 text-emerald-400" size={26} />
            <p className="font-display text-xl font-semibold leading-relaxed text-white">
              Buyer protection here is <span className="text-emerald-400">not insurance</span>. We return your own money
              from trust. No premium, no pool, no risk transfer.
            </p>
            <p className="mt-5 text-sm font-semibold text-emerald-400">
              Wakala fee schedule: PKR 25 up to 5,000 · PKR 75 to 25,000 · PKR 200 to 100,000 · capped at PKR 400
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------ integrations */

const PLATFORMS = [
  {
    icon: Store,
    name: "Shopify",
    how: "Subscribe our endpoint to your store's webhook topics from the admin or the API. Deliveries arrive HMAC-signed.",
    topics: ["orders/paid", "checkouts/update"],
  },
  {
    icon: Globe,
    name: "WordPress · WooCommerce",
    how: "Built-in webhooks: add our delivery URL and secret under Settings → Advanced → Webhooks. Cart recovery plugs in the same way.",
    topics: ["order.created", "cart.abandoned"],
  },
  {
    icon: Plug,
    name: "Custom stores",
    how: "One signed HTTPS POST per event. Verify the X-Sukoon-Signature header with your secret and you are live.",
    topics: ["payment.succeeded", "cart.pending"],
  },
];

function Integrations() {
  return (
    <section id="integrations" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-28">
      <FadeIn>
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-400">Plug in your store</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-bold text-white">
          Live on your store <span className="text-white/40">in minutes, not migrations.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Two webhooks carry the whole integration: a <span className="font-semibold text-white">checkout payment webhook</span>{" "}
          that lands every Sukoon Pay order in escrow instantly, and a{" "}
          <span className="font-semibold text-white">pending carts webhook</span> that streams abandoned checkouts straight
          into your seller dashboard so you can recover the sale.
        </p>
      </FadeIn>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLATFORMS.map((p, i) => (
          <FadeIn key={p.name} delay={i * 0.08}>
            <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:border-emerald-400/30 hover:bg-white/[0.06]">
              <p.icon size={20} className="text-emerald-400" />
              <h3 className="mt-3 font-display text-lg font-bold text-white">{p.name}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/45">{p.how}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {p.topics.map((t) => (
                  <code key={t} className="rounded-md bg-black/30 px-2 py-1 font-mono text-[10px] text-emerald-300/80">
                    {t}
                  </code>
                ))}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.15}>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-400">
              <ShoppingCart size={18} />
            </span>
            <p className="max-w-md text-sm text-white/60">
              Try it live: connect the webhooks in the seller dashboard, then abandon a cart on the demo store and watch it
              arrive.
            </p>
          </div>
          <Link
            to="/seller-dashboard/login"
            className="group flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-stone-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
          >
            Connect your store
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}

/* --------------------------------------------------------- final CTA */

function FinalCta() {
  return (
    <section className="relative overflow-hidden">
      <img src="/img/courier.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 grayscale" />
      <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-stone-950/70 to-stone-950" />
      <div className="relative mx-auto max-w-4xl px-6 py-32 text-center">
        <FadeIn>
          <p aria-hidden className="font-display mb-2 text-5xl font-bold text-emerald-400/25">سکون</p>
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">
            See a rupee held, verified,<br />
            <span className="text-gradient-emerald">and released in 90 seconds.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-white/50">
            The full escrow loop is live in this demo: store checkout, courier proof, inspection window, four-eyes
            disputes and the trust ledger. Drive it yourself.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/bazaar"
              className="group flex items-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 font-bold text-stone-950 shadow-xl shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              <Store size={18} /> Try the demo store
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="rounded-2xl border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white/85 backdrop-blur transition hover:bg-white/10"
            >
              Quick-launch a role
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ footer */

function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-8">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">س</span>
          <span className="font-display font-bold text-white">
            Sukoon <span className="text-emerald-400">Pay</span>
          </span>
        </div>
        <nav className="flex items-center gap-6 text-xs font-medium text-white/40">
          <a href="#how" className="transition hover:text-white/80">How it works</a>
          <a href="/#sharia" className="transition hover:text-white/80">Sharia &amp; fees</a>
          <a href="/#integrations" className="transition hover:text-white/80">Integrations</a>
          <Link to="/bazaar" className="transition hover:text-white/80">Demo store</Link>
          <Link to="/login" className="transition hover:text-white/80">Log in</Link>
        </nav>
        <p className="text-xs text-white/30">سکون · peace of mind · demonstration prototype, fake money</p>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------- */

export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-950 font-sans">
      <Nav />
      <Hero />
      <HowItWorks />
      <Stats />
      <Bento />
      <Sharia />
      <Integrations />
      <FinalCta />
      <Footer />
    </div>
  );
}
