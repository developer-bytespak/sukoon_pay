// The bridge to the real Sukoon Pay backend (Java/Spring money core).
// Every money movement now happens server-side; this module only calls the
// API and maps its responses into the shapes the dashboards already render.
// Amounts: the API speaks paisa (integer minor units), the UI speaks PKR.

import type {
  CartItem,
  CourierStatus,
  Dispute,
  DisputeReason,
  LedgerEntry,
  Order,
  OrderState,
  Proof,
  ProofType,
  Role,
  TimelineEvent,
} from "./types";
import { BACKEND_IDS, USERS } from "./constants";

export const API_BASE: string =
  (import.meta as { env?: Record<string, string> }).env?.VITE_API_BASE ?? "http://localhost:8080";

/* ------------------------- backend wire types ------------------------- */

interface ApiOrderItem {
  name: string;
  image: string | null;
  unitPricePaisa: number;
  quantity: number;
}

interface ApiShipment {
  trackingNumber: string | null;
  status: string;
  proofType: string | null;
  gpsMatch: boolean | null;
}

interface ApiDispute {
  id: string;
  state: string;
  reason: string | null;
  ruleApplied: string | null;
  suggestedResolution: "refund" | "release";
  approvalCount: number;
  approvers: { adminId: string; adminName: string }[];
}

interface ApiTimelineEntry {
  fromState: string | null;
  toState: string;
  event: string;
  note: string | null;
  at: string;
}

interface ApiLedgerEntry {
  account: string;
  direction: "DR" | "CR";
  amountPaisa: number;
  kind: string;
  memo: string | null;
  at: string;
}

export interface ApiOrder {
  id: string;
  reference: string;
  state: string;
  grossPaisa: number;
  wakalaFeePaisa: number;
  verificationFeePaisa: number;
  netToSellerPaisa: number;
  createdAt: string;
  noShipDeadline: string | null;
  inspectionEndsAt: string | null;
  items: ApiOrderItem[];
  shipment: ApiShipment | null;
  dispute: ApiDispute | null;
  timeline: ApiTimelineEntry[];
  ledger: ApiLedgerEntry[];
}

/* ------------------------- HTTP plumbing ------------------------- */

const ROLE_USER: Record<Role, string> = {
  buyer: BACKEND_IDS.buyer,
  seller: BACKEND_IDS.seller,
  courier: BACKEND_IDS.courier,
  admin: BACKEND_IDS.adminA,
};

function headers(role: Role, userId?: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Role": role,
    "X-User-Id": userId ?? ROLE_USER[role],
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const body = (await res.json()) as { message?: string; error?: string };
      detail = body.message || body.error || detail;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`API ${path} failed: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/* ------------------------- API calls ------------------------- */

export function fetchOrders(role: Role): Promise<ApiOrder[]> {
  return request<ApiOrder[]>("/api/orders", { headers: headers(role) });
}

export async function checkout(items: CartItem[], amountPkr: number): Promise<ApiOrder> {
  const created = await request<{ orderId: string; reference: string }>("/api/checkout", {
    method: "POST",
    headers: headers("buyer"),
    body: JSON.stringify({
      merchantId: BACKEND_IDS.merchant,
      amountPaisa: Math.round(amountPkr * 100),
      items: items.map((i) => ({
        name: i.name,
        image: i.image,
        unitPricePaisa: Math.round(i.price * 100),
        quantity: i.qty,
      })),
    }),
  });
  // The mock rail's paid-callback — funds escrow through the money core.
  return request<ApiOrder>(`/api/orders/${created.orderId}/confirm-payment`, {
    method: "POST",
    headers: headers("buyer"),
  });
}

export function ship(orderUuid: string, trackingNumber: string | null): Promise<ApiOrder> {
  return request<ApiOrder>(`/api/orders/${orderUuid}/ship`, {
    method: "POST",
    headers: headers("seller"),
    body: JSON.stringify({ trackingNumber }),
  });
}

export function confirmReceipt(orderUuid: string): Promise<ApiOrder> {
  return request<ApiOrder>(`/api/orders/${orderUuid}/confirm-receipt`, {
    method: "POST",
    headers: headers("buyer"),
  });
}

export function reportProblem(
  orderUuid: string,
  reason: DisputeReason,
  evidence: string | null
): Promise<ApiOrder> {
  return request<ApiOrder>(`/api/orders/${orderUuid}/report-problem`, {
    method: "POST",
    headers: headers("buyer"),
    body: JSON.stringify({ reason, evidence }),
  });
}

export function approveResolution(orderUuid: string, adminBackendId: string, forSeller: boolean): Promise<ApiOrder> {
  return request<ApiOrder>(`/api/orders/${orderUuid}/dispute/approvals`, {
    method: "POST",
    headers: headers("admin", adminBackendId),
    body: JSON.stringify({ forSeller }),
  });
}

export function reviewDelivery(orderUuid: string, accept: boolean): Promise<ApiOrder> {
  return request<ApiOrder>(`/api/orders/${orderUuid}/review`, {
    method: "POST",
    headers: headers("admin"),
    body: JSON.stringify({ accept }),
  });
}

export function courierStatus(orderUuid: string, status: CourierStatus, proof: Proof | null): Promise<unknown> {
  // Drives the REAL webhook pipeline: the backend composes a signed
  // mock-courier event and pushes it through verify -> dedupe -> dispatch.
  return request(`/api/demo/courier/${orderUuid}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      proofType: proof?.type ?? null,
      gpsMatch: proof?.gpsMatch ?? null,
    }),
  });
}

export function advanceClock(hours: number): Promise<{ demoNow: string }> {
  return request<{ demoNow: string }>("/api/demo/advance-clock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hours }),
  });
}

export function resetBackend(): Promise<unknown> {
  return request("/api/demo/reset", { method: "POST" });
}

export function requestPayout(amountPkr: number): Promise<{ status: string }> {
  return request<{ status: string }>("/api/payouts", {
    method: "POST",
    headers: headers("seller"),
    body: JSON.stringify({ amountPaisa: Math.round(amountPkr * 100) }),
  });
}

/* ------------------------- mapping to UI shapes ------------------------- */

const pkr = (paisa: number): number => paisa / 100;
const ms = (iso: string | null): number | null => (iso ? new Date(iso).getTime() : null);

const PROOF_VALUES: Record<string, string> = {
  photo: "POD-4471.jpg (door-step photo)",
  otp: "OTP 4-1-9-2 confirmed",
  signature: "Signature captured on device",
};

const COURIER_STATUS: Record<string, CourierStatus> = {
  pending_handover: "pending",
  picked_up: "picked_up",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
};

const TIMELINE_LABELS: Record<string, { label: string; detail?: string }> = {
  fund: { label: "Payment held in escrow", detail: "Funds held in trust (Amanah). Seller must ship within 3 days or an automatic refund fires." },
  ship: { label: "Marked shipped" },
  delivered_valid_proof: { label: "Delivered, inspection window open", detail: "Proof of delivery on file. Buyer has 7 days to confirm or report a problem; silence auto-releases." },
  delivered_weak_proof: { label: "Delivery claimed, proof suspicious", detail: "GPS mismatch or missing proof. Funds stay held; flagged for manual review. Not auto-released." },
  review_accept: { label: "Proof accepted after review", detail: "Manual review cleared the delivery proof; inspection window opened." },
  review_reject: { label: "Proof rejected, refunded", detail: "Delivery proof rejected on manual review; buyer refunded in full." },
  buyer_confirm: { label: "Buyer confirmed, released to seller", detail: "Funds released same-day. Fees deducted transparently." },
  window_expired: { label: "Auto-released to seller", detail: "Inspection window expired with no complaint. Silence becomes consent only after a real chance to object." },
  buyer_object: { label: "Dispute opened, funds frozen" },
  adjudicate_release: { label: "Adjudicated release", detail: "Published rule upheld the seller; four-eyes approved." },
  adjudicate_refund: { label: "Adjudicated refund", detail: "Published rule upheld the buyer; four-eyes approved." },
  no_ship_expired: { label: "Auto-refunded to buyer", detail: "Seller did not ship within 3 days; automatic refund, no dispute needed." },
  cancel: { label: "Cancelled, refunded in full" },
  rto: { label: "Returned to origin, refunded", detail: "Courier returned the parcel; buyer's trust funds returned in full." },
};

function mapTimeline(api: ApiOrder): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { at: new Date(api.createdAt).getTime(), label: "Order created", detail: "Buyer chose Pay with Sukoon Pay at checkout" },
  ];
  for (const t of api.timeline) {
    const meta = TIMELINE_LABELS[t.event] ?? { label: t.event };
    const detail =
      t.event === "ship" && t.note?.startsWith("tracking:")
        ? `Handed to ${USERS.courier.name} · tracking ${t.note.slice("tracking:".length)}`
        : meta.detail;
    events.push({ at: new Date(t.at).getTime(), label: meta.label, detail });
  }
  return events;
}

function mapDispute(api: ApiDispute | null): Dispute | null {
  if (!api) return null;
  const resolved = api.state.startsWith("resolved");
  return {
    reason: api.reason === "not_received" ? "not_received" : "defective",
    buyerEvidence: null,
    sellerEvidence: "Courier proof of delivery on file",
    ruleApplied: api.ruleApplied,
    suggestedResolution: api.suggestedResolution,
    approvals: api.approvers.map((a) => ({
      adminId: a.adminId === BACKEND_IDS.adminB ? USERS.adminB.id : USERS.adminA.id,
      adminName: a.adminName,
      at: 0,
    })),
    resolution: resolved ? (api.state === "resolved_refund" ? "refund" : "release") : null,
  };
}

export function mapOrder(api: ApiOrder): Order {
  const heldForReview = api.state === "HELD_FOR_REVIEW";
  // The UI models review-held as SHIPPED + flagged (its state set predates
  // the backend's explicit HELD_FOR_REVIEW state).
  const state = (heldForReview ? "SHIPPED" : api.state) as OrderState;

  const first = api.items[0];
  const extra = api.items.length - 1;
  const shipmentStatus = api.shipment ? (COURIER_STATUS[api.shipment.status] ?? "pending") : "pending";
  const delivered = api.shipment?.status === "delivered" || heldForReview || false;
  const proofType = (api.shipment?.proofType ?? null) as ProofType | null;
  const proof: Proof | null =
    delivered && api.shipment
      ? {
          type: proofType ?? "photo",
          value: PROOF_VALUES[proofType ?? "photo"],
          gpsMatch: api.shipment.gpsMatch ?? false,
        }
      : null;

  return {
    id: api.reference,
    uuid: api.id,
    productName: first ? (extra > 0 ? `${first.name} +${extra} more` : first.name) : api.reference,
    productImage: first?.image ?? "",
    items: api.items.map((i) => ({
      id: i.name,
      name: i.name,
      image: i.image ?? "",
      qty: i.quantity,
      price: pkr(i.unitPricePaisa),
    })),
    amount: pkr(api.grossPaisa),
    size: null,
    buyerId: USERS.buyer.id,
    sellerId: USERS.seller.id,
    state,
    paymentMethod: "sukoon",
    wakalaFee: pkr(api.wakalaFeePaisa),
    verificationFee: pkr(api.verificationFeePaisa),
    courier: {
      name: USERS.courier.name,
      trackingId: api.shipment?.trackingNumber ?? null,
      status: heldForReview ? "delivered" : shipmentStatus,
      proof,
      flaggedForReview: heldForReview,
    },
    noShipDeadline: state === "HELD_IN_ESCROW" ? ms(api.noShipDeadline) : null,
    inspectionWindowEndsAt: state === "INSPECTION_WINDOW" ? ms(api.inspectionEndsAt) : null,
    dispute: mapDispute(api.dispute),
    ledgerEntries: api.ledger.map(
      (e, idx): LedgerEntry => ({
        txnId: `${e.kind}-${idx}`,
        account: e.account,
        direction: e.direction,
        amount: pkr(e.amountPaisa),
        timestamp: new Date(e.at).getTime(),
        memo: e.memo ?? e.kind,
      })
    ),
    timeline: mapTimeline(api),
  };
}

/** Demo wallet: opening balance minus everything paid into escrow, plus refunds. */
export function buyerWalletBalance(orders: Order[], opening: number): number {
  let balance = opening;
  for (const o of orders) {
    if (o.state !== "CREATED") balance -= o.amount; // funded at some point
    if (o.state === "REFUNDED" || o.state === "AUTO_REFUNDED" || o.state === "CANCELLED") {
      balance += o.amount; // trust funds returned in full
    }
  }
  return balance;
}
