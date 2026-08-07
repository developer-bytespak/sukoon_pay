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
import { BACKEND_IDS, USERS, WEBHOOK_EVENT_CAP, WEBHOOK_TOPICS } from "./constants";
import * as api from "./api";

/**
 * The store is now a THIN CLIENT of the real Sukoon Pay backend: every money
 * movement (checkout, escrow, release, refund, disputes, timers) happens in
 * the Java money core and is fetched back via the API. What stays local is
 * the seller-SaaS simulation the backend deliberately doesn't own yet:
 * the storefront cart, merchant webhook cards, and pending-cart recovery.
 */
interface AppState {
  clock: number; // demo time = real time + backend clock offset
  clockOffset: number;
  orders: Order[]; // server truth, mapped for the dashboards
  currentRole: Role | null;
  pendingCheckout: PendingCheckout | null;
  apiError: string | null;
  loading: boolean;

  // storefront cart + merchant webhook simulation (local by design)
  cart: ShoppingCart;
  integrations: Record<WebhookType, WebhookConfig>;
  pendingCarts: PendingCart[];
  webhookEvents: WebhookEvent[];
  nextCartNo: number;
  nextEventNo: number;

  login: (role: Role) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  startCheckout: (draft: PendingCheckout) => void;
  pay: () => Promise<string | null>;
  shipOrder: (orderId: string, trackingId: string) => Promise<void>;
  courierUpdate: (orderId: string, status: CourierStatus, proof: Proof | null) => Promise<void>;
  confirmReceipt: (orderId: string) => Promise<void>;
  reportProblem: (orderId: string, reason: DisputeReason, evidence: string | null) => Promise<void>;
  approveResolution: (orderId: string, adminId: string, adminName: string) => Promise<void>;
  clearFlag: (orderId: string) => Promise<void>;
  refundFlagged: (orderId: string) => Promise<void>;
  requestPayout: (amountPkr: number) => Promise<boolean>;
  advanceClock: (ms: number) => Promise<void>;
  resetDemo: () => Promise<void>;

  connectWebhook: (type: WebhookType, platform: StorePlatform) => void;
  disconnectWebhook: (type: WebhookType) => void;
  sendTestEvent: (type: WebhookType) => void;
  addToCart: (product: CatalogProduct) => string;
  updateCartQty: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  nudgeCart: (cartId: string) => void;
}

/* ------------------------- local-sim helpers (unchanged) ------------------------- */

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

/* ------------------------- store ------------------------- */

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const uuidOf = (orderId: string): string | null =>
        get().orders.find((o) => o.id === orderId)?.uuid ?? null;

      /** Run an API action, swallow-and-surface errors, always re-sync from the server. */
      const action = async (fn: () => Promise<unknown>): Promise<void> => {
        try {
          set({ apiError: null });
          await fn();
        } catch (e) {
          set({ apiError: e instanceof Error ? e.message : String(e) });
        }
        await get().refresh();
      };

      return {
        clock: Date.now(),
        clockOffset: 0,
        orders: [],
        currentRole: null,
        pendingCheckout: null,
        apiError: null,
        loading: false,

        cart: emptyCart(),
        integrations: defaultIntegrations(),
        pendingCarts: [],
        webhookEvents: [],
        nextCartNo: 1042,
        nextEventNo: 1,

        login: (role) => {
          set({ currentRole: role });
          void get().refresh();
        },
        logout: () => set({ currentRole: null }),

        refresh: async () => {
          try {
            const role = get().currentRole ?? "admin";
            const apiOrders = await api.fetchOrders(role);
            set({
              orders: apiOrders.map(api.mapOrder),
              clock: Date.now() + get().clockOffset,
              apiError: null,
            });
          } catch (e) {
            set({ apiError: e instanceof Error ? e.message : String(e) });
          }
        },

        startCheckout: (draft) => set({ pendingCheckout: draft }),

        pay: async () => {
          const { pendingCheckout } = get();
          if (!pendingCheckout || pendingCheckout.items.length === 0) return null;
          set({ loading: true, apiError: null });
          try {
            // Real money movement: order created + escrow funded in the core.
            const order = await api.checkout(pendingCheckout.items, pendingCheckout.amount);
            set((s) => {
              const event = buildEvent(
                s,
                "payment",
                {
                  event: "checkout.paid",
                  order_id: order.reference,
                  amount_pkr: pendingCheckout.amount,
                  currency: "PKR",
                  line_items: pendingCheckout.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
                  buyer: USERS.buyer.consumerId,
                  escrow: "held_in_trust",
                },
                false
              );
              return {
                pendingCheckout: null,
                cart: emptyCart(),
                webhookEvents: pushEvent(s.webhookEvents, event),
                nextEventNo: s.nextEventNo + 1,
                pendingCarts: s.pendingCarts.map((c) =>
                  c.id === pendingCheckout.cartId && c.status !== "recovered"
                    ? { ...c, status: "recovered" as const }
                    : c
                ),
              };
            });
            await get().refresh();
            return order.reference;
          } catch (e) {
            set({ apiError: e instanceof Error ? e.message : String(e) });
            return null;
          } finally {
            set({ loading: false });
          }
        },

        shipOrder: async (orderId, trackingId) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.ship(uuid, trackingId || null));
        },

        courierUpdate: async (orderId, status, proof) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.courierStatus(uuid, status, proof));
        },

        confirmReceipt: async (orderId) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.confirmReceipt(uuid));
        },

        reportProblem: async (orderId, reason, evidence) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.reportProblem(uuid, reason, evidence));
        },

        approveResolution: async (orderId, adminId) => {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order?.dispute) return;
          const forSeller = order.dispute.suggestedResolution === "release";
          const backendAdmin = adminId === USERS.adminB.id ? BACKEND_IDS.adminB : BACKEND_IDS.adminA;
          await action(() => api.approveResolution(order.uuid, backendAdmin, forSeller));
        },

        clearFlag: async (orderId) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.reviewDelivery(uuid, true));
        },

        refundFlagged: async (orderId) => {
          const uuid = uuidOf(orderId);
          if (uuid) await action(() => api.reviewDelivery(uuid, false));
        },

        requestPayout: async (amountPkr) => {
          try {
            set({ apiError: null });
            await api.requestPayout(amountPkr);
            await get().refresh();
            return true;
          } catch (e) {
            set({ apiError: e instanceof Error ? e.message : String(e) });
            await get().refresh();
            return false;
          }
        },

        advanceClock: async (msJump) => {
          const hours = Math.max(1, Math.round(msJump / 3_600_000));
          set((s) => ({ clockOffset: s.clockOffset + hours * 3_600_000 }));
          // The backend fast-forwards its demo clock and runs the sweepers —
          // auto-release/auto-refund happen in the real money core.
          await action(() => api.advanceClock(hours));
        },

        resetDemo: async () => {
          try {
            await api.resetBackend();
          } catch (e) {
            set({ apiError: e instanceof Error ? e.message : String(e) });
          }
          set({
            clock: Date.now(),
            clockOffset: 0,
            orders: [],
            currentRole: null,
            pendingCheckout: null,
            cart: emptyCart(),
            integrations: defaultIntegrations(),
            pendingCarts: [],
            webhookEvents: [],
            nextCartNo: 1042,
            nextEventNo: 1,
          });
        },

        /* ---------------- local seller-SaaS simulation (unchanged) ---------------- */

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
            pendingCarts: s.pendingCarts.map((c) =>
              c.id === cartId && c.status === "open" ? { ...c, status: "nudged" as const } : c
            ),
          })),
      };
    },
    {
      name: "sukoon-pay-demo",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      // Orders are server truth — never persisted; only the local-sim slices are.
      partialize: (s) => ({
        currentRole: s.currentRole,
        clockOffset: s.clockOffset,
        pendingCheckout: s.pendingCheckout,
        cart: s.cart,
        integrations: s.integrations,
        pendingCarts: s.pendingCarts,
        webhookEvents: s.webhookEvents,
        nextCartNo: s.nextCartNo,
        nextEventNo: s.nextEventNo,
      }),
      migrate: (persisted, version) =>
        version < 3
          ? {
              // Pre-API snapshots carried locally-simulated orders; drop them.
              cart: emptyCart(),
              integrations: defaultIntegrations(),
              pendingCarts: [],
              webhookEvents: [],
              nextCartNo: 1042,
              nextEventNo: 1,
              clockOffset: 0,
            }
          : (persisted as object),
    }
  )
);

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
