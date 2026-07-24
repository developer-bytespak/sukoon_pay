import type { Order, PendingCheckout, Proof } from "./types";
import { DAY_MS, HOUR_MS, PRODUCTS } from "./constants";
import { applyCourierStatus, applyPay, applyShip, makeOrder } from "./transitions";

export interface Scenario {
  id: number;
  title: string;
  tagline: string;
  hint: string;
  seed: (clock: number) => Order[];
}

function draft(): PendingCheckout {
  const p = PRODUCTS[0];
  return { items: [{ id: p.id, name: p.name, image: p.image, qty: 1, price: p.price }], amount: p.price, cartId: null };
}

function paidOrder(clock: number, paidAgoMs: number): Order {
  const t0 = clock - paidAgoMs;
  const o = makeOrder(1, t0, draft());
  applyPay(o, t0);
  return o;
}

function inspectionOrder(clock: number, proof: Proof): Order {
  const o = paidOrder(clock, 2 * DAY_MS);
  applyShip(o, clock - 2 * DAY_MS + 4 * HOUR_MS, "TCS-778812");
  applyCourierStatus(o, clock - DAY_MS, "in_transit", null);
  applyCourierStatus(o, clock - 3 * HOUR_MS, "out_for_delivery", null);
  applyCourierStatus(o, clock - 1 * HOUR_MS, "delivered", proof);
  return o;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Happy path",
    tagline: "Deliver, confirm, instant settlement",
    hint: "Seller: Mark shipped → Courier: walk to Delivered with proof (GPS on) → Buyer: Confirm receipt → watch the release.",
    seed: (clock) => [paidOrder(clock, 0)],
  },
  {
    id: 2,
    title: "Silent buyer",
    tagline: "Window expires → auto-release",
    hint: "Order is delivered and in its inspection window. Fast-forward the clock 7 days → auto-release fires. The seller always gets paid.",
    seed: (clock) => [inspectionOrder(clock, { type: "photo", value: "POD-4471.jpg", gpsMatch: true })],
  },
  {
    id: 3,
    title: "Not received",
    tagline: "Dispute → adjudication → refund",
    hint: "Buyer: Report a problem → “Never received”. Courier proof is OTP-only (no photo), so Rule R2 refunds the buyer. Admin: two approvals (four-eyes) to move the money.",
    seed: (clock) => [inspectionOrder(clock, { type: "otp", value: "OTP 4-1-9-2 confirmed", gpsMatch: true })],
  },
  {
    id: 4,
    title: "Defective (SNAD)",
    tagline: "Photo evidence → return → refund",
    hint: "Buyer: Report a problem → “Defective / not as described” with a photo. Rule R3 refunds the buyer. Admin: four-eyes approval.",
    seed: (clock) => [inspectionOrder(clock, { type: "photo", value: "POD-4471.jpg", gpsMatch: true })],
  },
  {
    id: 5,
    title: "Seller never ships",
    tagline: "3-day timer → auto-refund",
    hint: "Order is paid but not shipped. Fast-forward the clock 3 days → automatic refund, no dispute needed.",
    seed: (clock) => [paidOrder(clock, 0)],
  },
  {
    id: 6,
    title: "Suspicious proof",
    tagline: "No GPS match → held, not released",
    hint: "Courier: set status to Delivered but toggle GPS match OFF → the order is flagged and held for review instead of opening the window. Admin decides.",
    seed: (clock) => {
      const o = paidOrder(clock, DAY_MS);
      applyShip(o, clock - 20 * HOUR_MS, "TCS-778812");
      applyCourierStatus(o, clock - 2 * HOUR_MS, "out_for_delivery", null);
      return [o];
    },
  },
];
