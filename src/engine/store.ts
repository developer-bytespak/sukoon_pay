import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CourierStatus, DisputeReason, Order, PendingCheckout, Proof, Role } from "./types";
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
}

function withOrder(orders: Order[], orderId: string, fn: (o: Order) => void): Order[] {
  return orders.map((o) => {
    if (o.id !== orderId) return o;
    const copy = structuredClone(o);
    fn(copy);
    return copy;
  });
}

// Timers fire only when the clock moves — deterministic, no real setTimeout.
function evaluateTimers(orders: Order[], clock: number): Order[] {
  return orders.map((o) => {
    if (o.state === "HELD_IN_ESCROW" && o.noShipDeadline !== null && clock >= o.noShipDeadline) {
      const copy = structuredClone(o);
      applyRefund(copy, o.noShipDeadline, "AUTO_REFUNDED", "Seller did not ship within 3 days — automatic refund, no dispute needed.");
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

      login: (role) => set({ currentRole: role }),
      logout: () => set({ currentRole: null }),

      startCheckout: (draft) => set({ pendingCheckout: draft }),

      pay: () => {
        const { pendingCheckout, clock, nextOrderNo } = get();
        if (!pendingCheckout) return null;
        const order = makeOrder(nextOrderNo, clock, pendingCheckout);
        applyPay(order, clock);
        set((s) => ({ orders: [...s.orders, order], nextOrderNo: s.nextOrderNo + 1, pendingCheckout: null }));
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
        set({
          clock,
          orders: scenario.seed(clock),
          nextOrderNo: 295,
          activeScenario: id,
          scenarioHint: scenario.hint,
          pendingCheckout: null,
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
        }),
    }),
    { name: "sukoon-pay-demo", storage: createJSONStorage(() => localStorage) }
  )
);
