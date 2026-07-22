// Engine smoke test — simulates all six demo scenarios without the UI.
import { DAY_MS, ACCOUNTS, BUYER_STARTING_BALANCE, USERS, PRODUCT } from "../src/engine/constants";
import {
  applyApproval,
  applyClearFlag,
  applyConfirm,
  applyCourierStatus,
  applyDispute,
  applyPay,
  applyRefund,
  applyShip,
  makeOrder,
} from "../src/engine/transitions";
import { balanceOf } from "../src/engine/ledger";
import { SCENARIOS } from "../src/engine/scenarios";

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name} ${detail}`);
  }
}

const T0 = 1_800_000_000_000;
const draft = { productName: PRODUCT.name, productImage: PRODUCT.image, amount: PRODUCT.price, size: "42" };

console.log("Scenario 1 — happy path");
{
  const o = makeOrder(1, T0, draft);
  applyPay(o, T0);
  check("held in escrow", o.state === "HELD_IN_ESCROW");
  check("escrow balance = amount", balanceOf([o], ACCOUNTS.escrow(o.id)) === PRODUCT.price);
  check("buyer wallet debited", balanceOf([o], ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE) === BUYER_STARTING_BALANCE - PRODUCT.price);
  applyShip(o, T0 + 1, "TCS-1");
  applyCourierStatus(o, T0 + 2, "delivered", { type: "photo", value: "p", gpsMatch: true });
  check("inspection window opened", o.state === "INSPECTION_WINDOW" && o.inspectionWindowEndsAt === T0 + 2 + 7 * DAY_MS);
  applyConfirm(o, T0 + 3, false);
  check("released", o.state === "RELEASED");
  check("escrow zeroed", balanceOf([o], ACCOUNTS.escrow(o.id)) === 0);
  check("seller got amount − fees", balanceOf([o], ACCOUNTS.sellerWallet) === PRODUCT.price - o.wakalaFee - o.verificationFee);
  check("platform fees earned", balanceOf([o], ACCOUNTS.platformFee) === o.wakalaFee + o.verificationFee);
  const drTotal = o.ledgerEntries.filter((e) => e.direction === "DR").reduce((s, e) => s + e.amount, 0);
  const crTotal = o.ledgerEntries.filter((e) => e.direction === "CR").reduce((s, e) => s + e.amount, 0);
  check("ledger balanced (DR = CR)", drTotal === crTotal);
}

console.log("Scenario 2 — silent buyer auto-release (via seed)");
{
  const [o] = SCENARIOS[1].seed(T0);
  check("seeded in inspection window", o.state === "INSPECTION_WINDOW");
  applyConfirm(o, o.inspectionWindowEndsAt!, true); // what evaluateTimers does
  check("auto-released", o.state === "RELEASED");
}

console.log("Scenario 3 — not received → R2 refund with four-eyes");
{
  const [o] = SCENARIOS[2].seed(T0);
  applyDispute(o, T0, "not_received", null);
  check("disputed", o.state === "DISPUTED");
  check("rule R2 suggests refund", o.dispute!.suggestedResolution === "refund", o.dispute!.ruleApplied ?? "");
  applyApproval(o, T0, USERS.adminA.id, USERS.adminA.name);
  check("one approval does NOT move money", o.state === "DISPUTED" && balanceOf([o], ACCOUNTS.escrow(o.id)) === PRODUCT.price);
  applyApproval(o, T0, USERS.adminA.id, USERS.adminA.name);
  check("same admin cannot double-approve", o.dispute!.approvals.length === 1);
  applyApproval(o, T0, USERS.adminB.id, USERS.adminB.name);
  check("second approver executes refund", o.state === "REFUNDED");
  check("buyer made whole", balanceOf([o], ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE) === BUYER_STARTING_BALANCE);
}

console.log("Scenario 3b — not received vs strong proof → R1 release");
{
  const [o] = SCENARIOS[1].seed(T0); // photo + gps
  applyDispute(o, T0, "not_received", null);
  check("rule R1 suggests release", o.dispute!.suggestedResolution === "release");
  applyApproval(o, T0, USERS.adminA.id, USERS.adminA.name);
  applyApproval(o, T0, USERS.adminB.id, USERS.adminB.name);
  check("adjudicated release", o.state === "RELEASED");
}

console.log("Scenario 4 — defective with evidence → R3 refund");
{
  const [o] = SCENARIOS[3].seed(T0);
  applyDispute(o, T0, "defective", "evidence-01.jpg");
  check("rule R3 suggests refund", o.dispute!.suggestedResolution === "refund");
}

console.log("Scenario 5 — never ships → auto-refund");
{
  const [o] = SCENARIOS[4].seed(T0);
  check("no-ship deadline set", o.noShipDeadline === T0 + 3 * DAY_MS);
  applyRefund(o, o.noShipDeadline!, "AUTO_REFUNDED", "timer"); // what evaluateTimers does
  check("auto-refunded, buyer whole", o.state === "AUTO_REFUNDED" && balanceOf([o], ACCOUNTS.buyerWallet, BUYER_STARTING_BALANCE) === BUYER_STARTING_BALANCE);
}

console.log("Scenario 6 — suspicious proof held, then adjudicated");
{
  const [o] = SCENARIOS[5].seed(T0);
  applyCourierStatus(o, T0, "delivered", { type: "photo", value: "p", gpsMatch: false });
  check("flagged, window NOT opened", o.state === "SHIPPED" && o.courier.flaggedForReview && o.inspectionWindowEndsAt === null);
  check("funds still in escrow", balanceOf([o], ACCOUNTS.escrow(o.id)) === PRODUCT.price);
  applyClearFlag(o, T0 + 1);
  check("admin accept opens window", o.state === "INSPECTION_WINDOW" && !o.courier.flaggedForReview);
}

console.log(failures === 0 ? "\nAll engine checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
