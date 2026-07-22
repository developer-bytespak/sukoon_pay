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
  id: string;
  productName: string;
  productImage: string; // emoji art — keeps the demo fully self-contained
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
  productName: string;
  productImage: string;
  amount: number;
  size: string | null;
}
