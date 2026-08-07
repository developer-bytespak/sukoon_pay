export type Role = "buyer" | "seller" | "courier" | "admin";

export type OrderState =
  | "CREATED"
  | "HELD_IN_ESCROW"
  | "SHIPPED"
  | "INSPECTION_WINDOW"
  | "DISPUTED"
  | "RELEASED"
  | "REFUNDED"
  | "AUTO_REFUNDED"
  | "CANCELLED";

export type CourierStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered";

export type ProofType = "otp" | "photo" | "signature";

export interface Proof {
  type: ProofType;
  value: string;
  gpsMatch: boolean;
}

export interface CourierInfo {
  name: string;
  trackingId: string | null;
  status: CourierStatus;
  proof: Proof | null;
  flaggedForReview: boolean;
}

export interface LedgerEntry {
  txnId: string;
  account: string;
  direction: "DR" | "CR";
  amount: number;
  timestamp: number;
  memo: string;
}

export interface TimelineEvent {
  at: number;
  label: string;
  detail?: string;
}

export type DisputeReason = "not_received" | "defective";
export type Resolution = "refund" | "release";

export interface Approval {
  adminId: string;
  adminName: string;
  at: number;
}

export interface Dispute {
  reason: DisputeReason;
  buyerEvidence: string | null;
  sellerEvidence: string | null;
  ruleApplied: string | null;
  suggestedResolution: Resolution;
  approvals: Approval[];
  resolution: Resolution | null;
}

export interface Order {
  id: string; // human reference, e.g. "SP-10300"
  uuid: string; // backend order id (UUID) — used for API calls
  productName: string; // display summary, e.g. "Street Runner Sneakers +2 more"
  productImage: string; // image path (older persisted orders may hold an emoji)
  items?: CartItem[];
  amount: number;
  size: string | null;
  buyerId: string;
  sellerId: string;
  state: OrderState;
  paymentMethod: "sukoon" | "cod";
  wakalaFee: number;
  verificationFee: number;
  courier: CourierInfo;
  noShipDeadline: number | null;
  inspectionWindowEndsAt: number | null;
  dispute: Dispute | null;
  ledgerEntries: LedgerEntry[];
  timeline: TimelineEvent[];
}

export interface PendingCheckout {
  items: CartItem[];
  amount: number; // cart total
  cartId?: string | null; // set when the buyer came from a cart, so paying recovers it
}

/* ------------------------- webhook simulation ------------------------- */

export type StorePlatform = "shopify" | "woocommerce" | "custom";
export type WebhookType = "payment" | "carts";

export interface WebhookConfig {
  connected: boolean;
  platform: StorePlatform | null;
  endpoint: string;
  secret: string;
  connectedAt: number | null;
}

export interface CartItem {
  id: string; // catalog product id
  name: string;
  image: string;
  qty: number;
  price: number;
}

export interface ShoppingCart {
  id: string | null; // becomes a CART-xxxx id on first add
  items: CartItem[];
}

export interface PendingCart {
  id: string; // "CART-1042"
  customerMasked: string; // "aye***@gmail.com"
  items: CartItem[];
  value: number;
  createdAt: number;
  status: "open" | "nudged" | "recovered";
}

export interface WebhookEvent {
  id: string; // "evt_00017"
  type: WebhookType;
  topic: string; // platform topic, e.g. "orders/paid" | "order.created" | "cart.abandoned"
  platform: StorePlatform;
  payload: Record<string, unknown>;
  signature: string; // fake HMAC, "sha256=..."
  deliveredAt: number;
  test: boolean;
  status: "delivered" | "skipped_not_connected";
}
