import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CourierStatus,
  DisputeReason,
  Order,
  PendingCart,
  PendingCheckout,
  Proof,
  Role,
  StorePlatform,
  WebhookConfig,
  WebhookEvent,
  WebhookType,
} from "./types";
import { USERS, WEBHOOK_EVENT_CAP, WEBHOOK_TOPICS } from "./constants";
import { SCENARIOS } from "./scenarios";
import {
  applyApproval,
  applyClearFlag,
  applyConfirm,
  applyCourierStatus,
  applyDispute,
  applyPay,
  applyRefund,
  applyRefundFlagged,
  applyShip,
  makeOrder,
} from "./transitions";

interface AppState {
  clock: number;
  orders: Order[];
  nextOrderNo: number;
  currentRole: Role | null;
  activeScenario: number | null;
  scenarioHint: string | null;
  pendingCheckout: PendingCheckout | null;

  // webhook simulation
  integrations: Record<WebhookType, WebhookConfig>;
  pendingCarts: PendingCart[];
  webhookEvents: WebhookEvent[]; // newest first, capped
  activeCartId: string | null; // the buyer's current cart on the storefront
  nextCartNo: number;
  nextEventNo: number;

  login: (role: Role) => void;
  logout: () => void;
  startCheckout: (draft: PendingCheckout) => void;
  pay: () => string | null;
  shipOrder: (orderId: string, trackingId: string) => void;
  courierUpdate: (orderId: string, status: CourierStatus, proof: Proof | null) => void;
  confirmReceipt: (orderId: string) => void;
  reportProblem: (orderId: string, reason: DisputeReason, evidence: string | null) => void;
  approveResolution: (orderId: string, adminId: string, adminName: string) => void;
  clearFlag: (orderId: string) => void;
  refundFlagged: (orderId: string) => void;
  advanceClock: (ms: number) => void;
  loadScenario: (id: number) => void;
  dismissHint: () => void;
  resetDemo: () => void;

  connectWebhook: (type: WebhookType, platform: StorePlatform) => void;
  disconnectWebhook: (type: WebhookType) => void;
  sendTestEvent: (type: WebhookType) => void;
  addToCart: (draft: PendingCheckout) => string;
  nudgeCart: (cartId: string) => void;
}

function withOrder(orders: Order[], orderId: string, fn: (o: Order) => void): Order[] {
  return orders.map((o) => {
    if (o.id !== orderId) return o;
    const copy = structuredClone(o);
    fn(copy);
    return copy;
  });
}

// Timers fire only when the clock moves. Deterministic, no real setTimeout.
function evaluateTimers(orders: Order[], clock: number): Order[] {
  return orders.map((o) => {
    if (o.state === "HELD_IN_ESCROW" && o.noShipDeadline !== null && clock >= o.noShipDeadline) {
      const copy = structuredClone(o);
      applyRefund(copy, o.noShipDeadline, "AUTO_REFUNDED", "Seller did not ship within 3 days, automatic refund, no dispute needed.");
      return copy;
    }
    if (o.state === "INSPECTION_WINDOW" && o.inspectionWindowEndsAt !== null && clock >= o.inspectionWindowEndsAt) {
      const copy = structuredClone(o);
      applyConfirm(copy, o.inspectionWindowEndsAt, true);
      return copy;
    }
    return o;
  });
}

/* ------------------------- webhook helpers ------------------------- */

function disconnectedConfig(): WebhookConfig {
  return { connected: false, platform: null, endpoint: "", secret: "", connectedAt: null };
}

function defaultIntegrations(): Record<WebhookType, WebhookConfig> {
  return { payment: disconnectedConfig(), carts: disconnectedConfig() };
}

function fakeSignature(seed: string): string {
  // Demo-only stand-in for an HMAC-SHA256 digest.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(h, 31) + seed.charCodeAt(i)) | 0;
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `sha256=${hex}${hex.split("").reverse().join("")}${((seed.length * 2654435761) >>> 0).toString(16)}`;
}

function buildEvent(
  state: Pick<AppState, "integrations" | "nextEventNo" | "clock">,
  type: WebhookType,
  payload: Record<string, unknown>,
  test: boolean
): WebhookEvent {
  const config = state.integrations[type];
  const platform = config.platform ?? "custom";
  const topic = WEBHOOK_TOPICS[type][platform];
  return {
    id: `evt_${String(state.nextEventNo).padStart(5, "0")}`,
    type,
    topic,
    platform,
    payload: { topic, ...payload },
    signature: fakeSignature(`${type}:${state.nextEventNo}:${JSON.stringify(payload)}`),
    deliveredAt: state.clock,
    test,
    status: config.connected ? "delivered" : "skipped_not_connected",
  };
}

function pushEvent(events: WebhookEvent[], event: WebhookEvent): WebhookEvent[] {
  return [event, ...events].slice(0, WEBHOOK_EVENT_CAP);
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clock: Date.now(),
      orders: [],
      nextOrderNo: 294,
      currentRole: null,
      activeScenario: null,
      scenarioHint: null,
      pendingCheckout: null,

      integrations: defaultIntegrations(),
      pendingCarts: [],
      webhookEvents: [],
      activeCartId: null,
      nextCartNo: 1042,
      nextEventNo: 1,

      login: (role) => set({ currentRole: role }),
      logout: () => set({ currentRole: null }),

      startCheckout: (draft) => set({ pendingCheckout: draft }),

      pay: () => {
        const { pendingCheckout, clock, nextOrderNo } = get();
        if (!pendingCheckout) return null;
        const order = makeOrder(nextOrderNo, clock, pendingCheckout);
        applyPay(order, clock);
        set((s) => {
          const event = buildEvent(
            s,
            "payment",
            {
              event: "checkout.paid",
              order_id: order.id,
              amount_pkr: order.amount,
              currency: "PKR",
              line_items: [{ name: order.productName, qty: 1, price: order.amount, size: order.size }],
              buyer: USERS.buyer.consumerId,
              escrow: "held_in_trust",
            },
            false
          );
          return {
            orders: [...s.orders, order],
            nextOrderNo: s.nextOrderNo + 1,
            pendingCheckout: null,
            activeCartId: null,
            webhookEvents: pushEvent(s.webhookEvents, event),
            nextEventNo: s.nextEventNo + 1,
            pendingCarts: s.pendingCarts.map((c) =>
              c.id === pendingCheckout.cartId && c.status !== "recovered" ? { ...c, status: "recovered" as const } : c
            ),
          };
        });
        return order.id;
      },

      shipOrder: (orderId, trackingId) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyShip(o, s.clock, trackingId)) })),

      courierUpdate: (orderId, status, proof) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyCourierStatus(o, s.clock, status, proof)) })),

      confirmReceipt: (orderId) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyConfirm(o, s.clock, false)) })),

      reportProblem: (orderId, reason, evidence) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyDispute(o, s.clock, reason, evidence)) })),

      approveResolution: (orderId, adminId, adminName) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyApproval(o, s.clock, adminId, adminName)) })),

      clearFlag: (orderId) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyClearFlag(o, s.clock)) })),

      refundFlagged: (orderId) =>
        set((s) => ({ orders: withOrder(s.orders, orderId, (o) => applyRefundFlagged(o, s.clock)) })),

      advanceClock: (ms) =>
        set((s) => {
          const clock = s.clock + ms;
          return { clock, orders: evaluateTimers(s.orders, clock) };
        }),

      loadScenario: (id) => {
        const scenario = SCENARIOS.find((sc) => sc.id === id);
        if (!scenario) return;
        const clock = Date.now();
        // integrations survive a scenario switch (the presenter shouldn't reconnect);
        // carts and events are cleared with the rest of the storyline state.
        set({
          clock,
          orders: scenario.seed(clock),
          nextOrderNo: 295,
          activeScenario: id,
          scenarioHint: scenario.hint,
          pendingCheckout: null,
          pendingCarts: [],
          webhookEvents: [],
          activeCartId: null,
          nextCartNo: 1042,
          nextEventNo: 1,
        });
      },

      dismissHint: () => set({ scenarioHint: null }),

      resetDemo: () =>
        set({
          clock: Date.now(),
          orders: [],
          nextOrderNo: 294,
          currentRole: null,
          activeScenario: null,
          scenarioHint: null,
          pendingCheckout: null,
          integrations: defaultIntegrations(),
          pendingCarts: [],
          webhookEvents: [],
          activeCartId: null,
          nextCartNo: 1042,
          nextEventNo: 1,
        }),

      connectWebhook: (type, platform) =>
        set((s) => {
          const suffix = `${type === "payment" ? "pmt" : "crt"}_${(s.clock % 0xfffff).toString(36)}`;
          return {
            integrations: {
              ...s.integrations,
              [type]: {
                connected: true,
                platform,
                endpoint: `https://hooks.sukoonpay.pk/v1/${USERS.seller.id}/wh_live_${suffix}`,
                secret: `whsec_${suffix}${(s.nextEventNo * 7919).toString(36)}`,
                connectedAt: s.clock,
              },
            },
          };
        }),

      disconnectWebhook: (type) =>
        set((s) => ({ integrations: { ...s.integrations, [type]: disconnectedConfig() } })),

      sendTestEvent: (type) =>
        set((s) => {
          const event = buildEvent(
            s,
            type,
            {
              event: type === "payment" ? "checkout.paid" : "cart.pending",
              test: true,
              note: "Test delivery from the Sukoon Pay dashboard",
            },
            true
          );
          return { webhookEvents: pushEvent(s.webhookEvents, event), nextEventNo: s.nextEventNo + 1 };
        }),

      addToCart: (draft) => {
        const cartId = `CART-${get().nextCartNo}`;
        set((s) => {
          const connected = s.integrations.carts.connected;
          const event = buildEvent(
            s,
            "carts",
            {
              event: "cart.pending",
              cart_id: cartId,
              customer: "aye***@gmail.com",
              line_items: [{ name: draft.productName, qty: 1, price: draft.amount, size: draft.size }],
              value_pkr: draft.amount,
              note: "Checkout not completed. Real cart-recovery plugins fire after a cutoff; the demo fires immediately.",
            },
            false
          );
          const cart: PendingCart = {
            id: cartId,
            customerMasked: "aye***@gmail.com",
            items: [{ name: draft.productName, image: draft.productImage, qty: 1, price: draft.amount }],
            value: draft.amount,
            createdAt: s.clock,
            status: "open",
          };
          return {
            webhookEvents: pushEvent(s.webhookEvents, event),
            nextEventNo: s.nextEventNo + 1,
            nextCartNo: s.nextCartNo + 1,
            activeCartId: cartId,
            // the cart is only captured for the seller when the carts webhook is connected
            pendingCarts: connected ? [cart, ...s.pendingCarts] : s.pendingCarts,
          };
        });
        return cartId;
      },

      nudgeCart: (cartId) =>
        set((s) => ({
          pendingCarts: s.pendingCarts.map((c) => (c.id === cartId && c.status === "open" ? { ...c, status: "nudged" as const } : c)),
        })),
    }),
    {
      name: "sukoon-pay-demo",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      // Older localStorage snapshots predate the webhook fields; fill them in.
      migrate: (persisted) => ({
        integrations: defaultIntegrations(),
        pendingCarts: [],
        webhookEvents: [],
        activeCartId: null,
        nextCartNo: 1042,
        nextEventNo: 1,
        ...(persisted as object),
      }),
    }
  )
);
