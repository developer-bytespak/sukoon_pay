import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  CartItem,
  CourierStatus,
  DisputeReason,
  Order,
  PendingCart,
  PendingCheckout,
  Proof,
  Role,
  ShoppingCart,
  StorePlatform,
  WebhookConfig,
  WebhookEvent,
  WebhookType,
} from "./types";
import type { CatalogProduct } from "./constants";
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

  // storefront cart + webhook simulation
  cart: ShoppingCart;
  integrations: Record<WebhookType, WebhookConfig>;
  pendingCarts: PendingCart[];
  webhookEvents: WebhookEvent[]; // newest first, capped
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
  addToCart: (product: CatalogProduct) => string;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
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

function emptyCart(): ShoppingCart {
  return { id: null, items: [] };
}

function cartValue(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty * i.price, 0);
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

      cart: emptyCart(),
      integrations: defaultIntegrations(),
      pendingCarts: [],
      webhookEvents: [],
      nextCartNo: 1042,
      nextEventNo: 1,

      login: (role) => set({ currentRole: role }),
      logout: () => set({ currentRole: null }),

      startCheckout: (draft) => set({ pendingCheckout: draft }),

      pay: () => {
        const { pendingCheckout, clock, nextOrderNo } = get();
        if (!pendingCheckout || pendingCheckout.items.length === 0) return null;
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
              line_items: pendingCheckout.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
              buyer: USERS.buyer.consumerId,
              escrow: "held_in_trust",
            },
            false
          );
          return {
            orders: [...s.orders, order],
            nextOrderNo: s.nextOrderNo + 1,
            pendingCheckout: null,
            cart: emptyCart(),
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
        // the cart, carts and events are cleared with the rest of the storyline state.
        set({
          clock,
          orders: scenario.seed(clock),
          nextOrderNo: 295,
          activeScenario: id,
          scenarioHint: scenario.hint,
          pendingCheckout: null,
          cart: emptyCart(),
          pendingCarts: [],
          webhookEvents: [],
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
          cart: emptyCart(),
          integrations: defaultIntegrations(),
          pendingCarts: [],
          webhookEvents: [],
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

      // Each add mirrors Shopify's checkouts/update: the whole cart snapshot is delivered again.
      addToCart: (product) => {
        const cartId = get().cart.id ?? `CART-${get().nextCartNo}`;
        set((s) => {
          const isNewCart = s.cart.id === null;
          const existing = s.cart.items.find((i) => i.id === product.id);
          const items = existing
            ? s.cart.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
            : [...s.cart.items, { id: product.id, name: product.name, image: product.image, qty: 1, price: product.price }];
          const value = cartValue(items);
          const event = buildEvent(
            s,
            "carts",
            {
              event: "cart.pending",
              cart_id: cartId,
              customer: "aye***@gmail.com",
              line_items: items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
              value_pkr: value,
              note: "Checkout not completed. Real cart-recovery plugins fire after a cutoff; the demo fires immediately.",
            },
            false
          );
          const connected = s.integrations.carts.connected;
          const existingRow = s.pendingCarts.find((c) => c.id === cartId);
          const row: PendingCart = {
            id: cartId,
            customerMasked: "aye***@gmail.com",
            items,
            value,
            createdAt: existingRow?.createdAt ?? s.clock,
            status: existingRow && existingRow.status !== "recovered" ? existingRow.status : "open",
          };
          return {
            cart: { id: cartId, items },
            nextCartNo: isNewCart ? s.nextCartNo + 1 : s.nextCartNo,
            webhookEvents: pushEvent(s.webhookEvents, event),
            nextEventNo: s.nextEventNo + 1,
            pendingCarts: !connected
              ? s.pendingCarts
              : existingRow
                ? s.pendingCarts.map((c) => (c.id === cartId ? row : c))
                : [row, ...s.pendingCarts],
          };
        });
        return cartId;
      },

      updateCartQty: (productId, delta) =>
        set((s) => {
          const items = s.cart.items
            .map((i) => (i.id === productId ? { ...i, qty: i.qty + delta } : i))
            .filter((i) => i.qty > 0);
          return syncCartState(s, items);
        }),

      removeFromCart: (productId) =>
        set((s) => syncCartState(s, s.cart.items.filter((i) => i.id !== productId))),

      nudgeCart: (cartId) =>
        set((s) => ({
          pendingCarts: s.pendingCarts.map((c) => (c.id === cartId && c.status === "open" ? { ...c, status: "nudged" as const } : c)),
        })),
    }),
    {
      name: "sukoon-pay-demo",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // Older localStorage snapshots predate the cart/webhook fields; fill them in.
      migrate: (persisted) => ({
        cart: emptyCart(),
        integrations: defaultIntegrations(),
        pendingCarts: [],
        webhookEvents: [],
        nextCartNo: 1042,
        nextEventNo: 1,
        ...(persisted as object),
      }),
    }
  )
);

// Quantity edits keep the seller's pending-cart row in sync without spamming the event log.
function syncCartState(
  s: Pick<AppState, "cart" | "pendingCarts">,
  items: CartItem[]
): Pick<AppState, "cart" | "pendingCarts"> {
  const cartId = s.cart.id;
  if (!cartId) return { cart: s.cart, pendingCarts: s.pendingCarts };
  if (items.length === 0) {
    return { cart: emptyCart(), pendingCarts: s.pendingCarts.filter((c) => c.id !== cartId || c.status === "recovered") };
  }
  const value = cartValue(items);
  return {
    cart: { id: cartId, items },
    pendingCarts: s.pendingCarts.map((c) => (c.id === cartId && c.status !== "recovered" ? { ...c, items, value } : c)),
  };
}
