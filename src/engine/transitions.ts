import type {
  CourierStatus,
  Dispute,
  DisputeReason,
  Order,
  PendingCheckout,
  Proof,
  Resolution,
} from "./types";
import { ACCOUNTS, DAY_MS, INSPECTION_WINDOW_DAYS, NO_SHIP_DAYS, USERS, VERIFICATION_FEE } from "./constants";
import { computeWakalaFee } from "./fees";
import { postPair } from "./ledger";

// All transition helpers mutate the order passed in; the store clones before applying.

export function makeOrder(orderNo: number, clock: number, draft: PendingCheckout): Order {
  const first = draft.items[0];
  const extra = draft.items.length - 1;
  return {
    id: `SP-${10_000 + orderNo}`,
    productName: extra > 0 ? `${first.name} +${extra} more` : first.name,
    productImage: first.image,
    items: draft.items,
    amount: draft.amount,
    size: null,
    buyerId: USERS.buyer.id,
    sellerId: USERS.seller.id,
    state: "CREATED",
    paymentMethod: "sukoon",
    wakalaFee: computeWakalaFee(draft.amount),
    verificationFee: VERIFICATION_FEE,
    courier: {
      name: USERS.courier.name,
      trackingId: null,
      status: "pending",
      proof: null,
      flaggedForReview: false,
    },
    noShipDeadline: null,
    inspectionWindowEndsAt: null,
    dispute: null,
    ledgerEntries: [],
    timeline: [{ at: clock, label: "Order created", detail: "Buyer chose Pay with Sukoon Pay at checkout" }],
  };
}

export function applyPay(o: Order, clock: number): void {
  o.state = "HELD_IN_ESCROW";
  o.noShipDeadline = clock + NO_SHIP_DAYS * DAY_MS;
  postPair(o, clock, ACCOUNTS.buyerWallet, ACCOUNTS.escrow(o.id), o.amount, "Buyer payment into escrow (Amanah, held in trust)");
  o.timeline.push({
    at: clock,
    label: "Payment held in escrow",
    detail: `Funds held in trust. Seller must ship within ${NO_SHIP_DAYS} days or an automatic refund fires.`,
  });
}

export function applyShip(o: Order, clock: number, trackingId: string): void {
  o.state = "SHIPPED";
  o.noShipDeadline = null;
  o.courier.trackingId = trackingId;
  o.courier.status = "picked_up";
  o.timeline.push({ at: clock, label: "Marked shipped", detail: `Handed to ${o.courier.name} · tracking ${trackingId}` });
}

const COURIER_LABELS: Record<CourierStatus, string> = {
  pending: "Awaiting pickup",
  picked_up: "Picked up by courier",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
};

export function applyCourierStatus(o: Order, clock: number, status: CourierStatus, proof: Proof | null): void {
  o.courier.status = status;
  if (status !== "delivered") {
    o.timeline.push({ at: clock, label: COURIER_LABELS[status] });
    return;
  }
  o.courier.proof = proof;
  const proofValid = proof !== null && proof.gpsMatch;
  if (proofValid) {
    o.state = "INSPECTION_WINDOW";
    o.inspectionWindowEndsAt = clock + INSPECTION_WINDOW_DAYS * DAY_MS;
    o.timeline.push({
      at: clock,
      label: "Delivered, inspection window open",
      detail: `Proof of delivery (${proof.type}) on file. Buyer has ${INSPECTION_WINDOW_DAYS} days to confirm or report a problem; silence auto-releases.`,
    });
  } else {
    o.courier.flaggedForReview = true;
    o.timeline.push({
      at: clock,
      label: "Delivery claimed, proof suspicious",
      detail: "GPS mismatch or missing proof. Funds stay held; flagged for manual review. Not auto-released.",
    });
  }
}

function postRelease(o: Order, clock: number, memo: string): void {
  const settlement = o.amount - o.wakalaFee - o.verificationFee;
  postPair(o, clock, ACCOUNTS.escrow(o.id), ACCOUNTS.sellerWallet, settlement, memo);
  postPair(o, clock, ACCOUNTS.escrow(o.id), ACCOUNTS.platformFee, o.wakalaFee, "Wakala (agency) fee, fixed and capped");
  postPair(o, clock, ACCOUNTS.escrow(o.id), ACCOUNTS.platformFee, o.verificationFee, "Delivery-verification fee");
}

export function applyConfirm(o: Order, clock: number, auto: boolean): void {
  o.state = "RELEASED";
  postRelease(o, clock, auto ? "Auto-release on window expiry, settlement to seller (T+0)" : "Buyer confirmed receipt, settlement to seller (T+0)");
  o.timeline.push({
    at: clock,
    label: auto ? "Auto-released to seller" : "Buyer confirmed, released to seller",
    detail: auto
      ? "Inspection window expired with no complaint. Silence becomes consent only after the buyer had a real chance to object."
      : "Funds released same-day. Fees deducted transparently.",
  });
}

export function applyRefund(o: Order, clock: number, kind: "REFUNDED" | "AUTO_REFUNDED", reason: string): void {
  o.state = kind;
  o.noShipDeadline = null;
  postPair(o, clock, ACCOUNTS.escrow(o.id), ACCOUNTS.buyerWallet, o.amount, "Refund: buyer's own trust funds returned in full");
  o.timeline.push({ at: clock, label: kind === "AUTO_REFUNDED" ? "Auto-refunded to buyer" : "Refunded to buyer", detail: reason });
}

// The published decision table. Both parties can predict the outcome (no gharar).
export function evaluateRule(reason: DisputeReason, proof: Proof | null, buyerEvidence: string | null): { rule: string; suggested: Resolution } {
  if (reason === "not_received") {
    if (proof && proof.type === "photo" && proof.gpsMatch) {
      return { rule: "Rule R1: Non-receipt claim vs strong courier proof (photo + GPS match): release to seller.", suggested: "release" };
    }
    return { rule: "Rule R2: Non-receipt claim and courier proof lacks photo or GPS corroboration: refund buyer.", suggested: "refund" };
  }
  if (buyerEvidence) {
    return { rule: "Rule R3: Defective / not-as-described with buyer photo evidence: refund buyer (return initiated).", suggested: "refund" };
  }
  return { rule: "Rule R4: Defect claim without evidence: release to seller.", suggested: "release" };
}

export function applyDispute(o: Order, clock: number, reason: DisputeReason, buyerEvidence: string | null): void {
  const { rule, suggested } = evaluateRule(reason, o.courier.proof, buyerEvidence);
  const dispute: Dispute = {
    reason,
    buyerEvidence,
    sellerEvidence: "Courier proof of delivery on file",
    ruleApplied: rule,
    suggestedResolution: suggested,
    approvals: [],
    resolution: null,
  };
  o.state = "DISPUTED";
  o.dispute = dispute;
  o.inspectionWindowEndsAt = null;
  o.timeline.push({
    at: clock,
    label: "Dispute opened, funds frozen",
    detail: `${reason === "not_received" ? "Buyer reports non-receipt" : "Buyer reports defective / not as described"}. ${rule}`,
  });
}

export function applyApproval(o: Order, clock: number, adminId: string, adminName: string): void {
  if (!o.dispute || o.dispute.resolution) return;
  if (o.dispute.approvals.some((a) => a.adminId === adminId)) return; // same admin cannot approve twice
  o.dispute.approvals.push({ adminId, adminName, at: clock });
  o.timeline.push({ at: clock, label: `Adjudication approval ${o.dispute.approvals.length}/2`, detail: `${adminName} approved: ${o.dispute.suggestedResolution}` });
  if (o.dispute.approvals.length < 2) return; // four-eyes: money moves only on the second approval
  o.dispute.resolution = o.dispute.suggestedResolution;
  if (o.dispute.suggestedResolution === "refund") {
    applyRefund(o, clock, "REFUNDED", "Adjudicated per published rules, four-eyes approved.");
  } else {
    applyConfirm(o, clock, false);
    o.timeline.push({ at: clock, label: "Adjudicated release", detail: "Published rule upheld the seller; four-eyes approved." });
  }
}

export function applyClearFlag(o: Order, clock: number): void {
  if (!o.courier.flaggedForReview) return;
  o.courier.flaggedForReview = false;
  o.state = "INSPECTION_WINDOW";
  o.inspectionWindowEndsAt = clock + INSPECTION_WINDOW_DAYS * DAY_MS;
  o.timeline.push({ at: clock, label: "Proof accepted after review", detail: "Manual review cleared the delivery proof; inspection window opened." });
}

export function applyRefundFlagged(o: Order, clock: number): void {
  if (!o.courier.flaggedForReview) return;
  o.courier.flaggedForReview = false;
  applyRefund(o, clock, "REFUNDED", "Delivery proof rejected on manual review, refund to buyer.");
}
