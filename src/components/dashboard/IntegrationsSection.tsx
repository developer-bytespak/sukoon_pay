import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Copy, CreditCard, Plug, ShoppingCart, Webhook, Zap } from "lucide-react";
import { useStore } from "../../engine/store";
import type { StorePlatform, WebhookType } from "../../engine/types";
import { WEBHOOK_TOPICS } from "../../engine/constants";
import { formatSimDate } from "../../lib/format";
import { GlassCard, SectionHeader } from "./ui";

const PLATFORM_LABELS: Record<StorePlatform, string> = {
  shopify: "Shopify",
  woocommerce: "WordPress · WooCommerce",
  custom: "Custom store",
};

const CARD_COPY: Record<WebhookType, { title: string; desc: string; icon: typeof CreditCard }> = {
  payment: {
    title: "Checkout payment webhook",
    desc: "Fires when a buyer pays with Sukoon Pay at your checkout. The order lands here instantly, already held in escrow.",
    icon: CreditCard,
  },
  carts: {
    title: "Pending carts webhook",
    desc: "Streams carts your customers filled but never paid for into this dashboard, so you can recover the sale.",
    icon: ShoppingCart,
  },
};

function snippetFor(type: WebhookType, platform: StorePlatform, endpoint: string, secret: string): string {
  const topic = WEBHOOK_TOPICS[type][platform];
  const ep = endpoint || "<generated when you connect>";
  const sec = secret || "<generated when you connect>";
  if (platform === "shopify") {
    return `POST /admin/api/2025-01/webhooks.json
{
  "webhook": {
    "topic": "${topic}",
    "address": "${ep}",
    "format": "json"
  }
}
# Deliveries arrive signed with X-Shopify-Hmac-SHA256;
# Sukoon Pay verifies against your shared secret.`;
  }
  if (platform === "woocommerce") {
    return `WooCommerce → Settings → Advanced → Webhooks → Add webhook
  Name:         Sukoon Pay ${type === "payment" ? "payments" : "pending carts"}
  Status:       Active
  Topic:        ${topic}
  Delivery URL: ${ep}
  Secret:       ${sec}
# WooCommerce signs each delivery with the secret (HMAC-SHA256).${type === "carts" ? "\n# Pending carts need the Cart Abandonment Recovery plugin,\n# which fires this webhook after its cutoff timer." : ""}`;
  }
  return `curl -X POST ${ep} \\
  -H "Content-Type: application/json" \\
  -H "X-Sukoon-Signature: sha256=<hmac_of_body_with_your_secret>" \\
  -d '{ "event": "${topic}", "order_id": "...", "amount_pkr": 4999 }'
# Sign the raw body with HMAC-SHA256 using: ${sec}`;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2">
      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</span>
      <code className="flex-1 truncate font-mono text-[11px] text-white/70">{value}</code>
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(value).catch(() => undefined);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 text-white/40 transition hover:text-white"
        title={`Copy ${label}`}
      >
        {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

function WebhookCard({ type }: { type: WebhookType }) {
  const { integrations, webhookEvents, connectWebhook, disconnectWebhook, sendTestEvent } = useStore();
  const config = integrations[type];
  const [platform, setPlatform] = useState<StorePlatform>(config.platform ?? "shopify");
  const copy = CARD_COPY[type];
  const missed = (webhookEvents ?? []).filter((e) => e.type === type && e.status === "skipped_not_connected" && !e.test).length;

  return (
    <GlassCard className="flex h-full flex-col" data-testid={`webhook-card-${type}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 text-teal-300">
            <copy.icon size={16} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">{copy.title}</h3>
            <p className="text-[11px] text-white/35">
              Topic: <code className="font-mono text-teal-300/80">{WEBHOOK_TOPICS[type][config.platform ?? platform]}</code>
            </p>
          </div>
        </div>
        {config.connected ? (
          <span className="flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
            <CheckCircle2 size={11} /> Connected · {PLATFORM_LABELS[config.platform!]}
          </span>
        ) : (
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-0.5 text-[11px] font-bold text-white/40">
            Not connected
          </span>
        )}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-white/45">{copy.desc}</p>

      {!config.connected && missed > 0 && (
        <p className="mt-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.08] px-3 py-2 text-xs font-semibold text-amber-300">
          {missed} {type === "carts" ? (missed === 1 ? "cart" : "carts") : missed === 1 ? "payment event" : "payment events"} missed
          while disconnected. Connect to stop losing them.
        </p>
      )}

      {!config.connected && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(Object.keys(PLATFORM_LABELS) as StorePlatform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`rounded-lg px-1 py-1.5 text-[11px] font-bold transition ${
                  platform === p ? "bg-teal-500 text-stone-950" : "text-white/45 hover:text-white"
                }`}
              >
                {p === "woocommerce" ? "WordPress" : PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[10px] leading-relaxed text-white/55">
            {snippetFor(type, platform, config.endpoint, config.secret)}
          </pre>
          <button
            data-testid={`connect-${type}`}
            onClick={() => connectWebhook(type, platform)}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-sm font-bold text-stone-950 shadow-lg shadow-teal-500/20 transition hover:bg-teal-400"
          >
            <Plug size={15} /> Connect {PLATFORM_LABELS[platform]}
          </button>
        </>
      )}

      {config.connected && (
        <>
          <div className="mt-4 space-y-2">
            <CopyField label="Endpoint" value={config.endpoint} />
            <CopyField label="Secret" value={config.secret} />
          </div>
          <p className="mt-2 text-[10px] text-white/30">
            Deliveries are signed with HMAC-SHA256 of the raw body using this secret. Connected {formatSimDate(config.connectedAt!)}.
          </p>
          <div className="mt-auto flex gap-2 pt-4">
            <button
              data-testid={`test-${type}`}
              onClick={() => sendTestEvent(type)}
              className="flex items-center gap-1.5 rounded-lg border border-teal-400/30 bg-teal-400/10 px-3.5 py-2 text-xs font-bold text-teal-300 transition hover:bg-teal-400/20"
            >
              <Zap size={13} /> Send test delivery
            </button>
            <button
              onClick={() => disconnectWebhook(type)}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold text-white/40 transition hover:bg-white/5 hover:text-white"
            >
              Disconnect
            </button>
          </div>
        </>
      )}
    </GlassCard>
  );
}

function EventLog() {
  const webhookEvents = useStore((s) => s.webhookEvents ?? []);
  return (
    <GlassCard className="mt-4">
      <h3 className="mb-3 text-sm font-bold text-white">Webhook event log</h3>
      {webhookEvents.length === 0 ? (
        <p className="py-4 text-center text-xs text-white/30">
          Deliveries will appear here: checkout payments, pending carts and test events.
        </p>
      ) : (
        <div className="space-y-1.5">
          {webhookEvents.map((e) => (
            <details key={e.id} className="group rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 text-xs">
                {e.status === "delivered" ? (
                  <span className="rounded bg-emerald-400/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">200 delivered</span>
                ) : (
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white/40">skipped · not connected</span>
                )}
                <code className="font-mono font-semibold text-white/75">{e.topic}</code>
                {e.test && <span className="rounded bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">test</span>}
                <span className="text-white/30">{PLATFORM_LABELS[e.platform]}</span>
                <span className="ml-auto font-mono text-[10px] text-white/25">
                  {e.id} · {formatSimDate(e.deliveredAt)}
                </span>
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-2.5 font-mono text-[10px] leading-relaxed text-white/50">
                {JSON.stringify(e.payload, null, 2)}
                {"\n"}
                {`X-Sukoon-Signature: ${e.signature}`}
              </pre>
            </details>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

export default function IntegrationsSection() {
  return (
    <>
      <SectionHeader
        icon={Webhook}
        title="Integrations"
        sub="Connect your store once. Works with Shopify, WordPress (WooCommerce) and custom stores."
        id="integrations"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <WebhookCard type="payment" />
        <WebhookCard type="carts" />
      </div>
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <EventLog />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
