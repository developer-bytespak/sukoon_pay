// Live end-to-end smoke: drives the REAL UI against the REAL backend.
// Storyline: buyer shops -> pays into escrow -> seller ships -> courier
// delivers with GPS proof -> buyer confirms -> released; admin console shows
// the ledger. Screenshots land in scripts/e2e-shots/.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const APP = "http://localhost:5173";
const API = "http://localhost:8080";
const SHOTS = fileURLToPath(new URL("./e2e-shots/", import.meta.url));

const step = (msg) => console.log(`\n== ${msg}`);
const fail = (msg) => {
  console.error(`FAILED: ${msg}`);
  process.exit(1);
};

mkdirSync(SHOTS, { recursive: true });

// Fresh backend state so the run is deterministic.
const reset = await fetch(`${API}/api/demo/reset`, { method: "POST" });
if (!reset.ok) fail(`backend reset returned ${reset.status}`);
step("Backend reset + reseeded");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.setDefaultTimeout(15000);

// Clean slate in the browser too (persisted local-sim state).
await page.goto(APP);
await page.evaluate(() => localStorage.clear());

step("Buyer: store -> cart -> Sukoon checkout");
await page.goto(`${APP}/store`);
await page.getByTestId("add-sneakers").click();
await page.getByTestId("cart-button").click();
await page.getByTestId("pay-sukoon").click();
await page.waitForURL("**/checkout");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: "Verify" }).click();
await page.getByRole("button", { name: /Confirm & pay into escrow/ }).click();

step("Buyer dashboard: order HELD_IN_ESCROW from the real ledger");
await page.waitForURL("**/buyer-dashboard");
await page.getByText(/SP-10\d+/).first().waitFor();
const reference = (await page.getByText(/SP-10\d+/).first().textContent())?.match(/SP-10\d+/)?.[0];
if (!reference) fail("no order reference rendered");
console.log(`   order ${reference}`);
await page.getByText("In Escrow", { exact: false }).first().waitFor();
await page.screenshot({ path: `${SHOTS}/1-buyer-escrow.png`, fullPage: false });

step("Seller: mark shipped (books via mock courier)");
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-role-seller").click();
await page.getByRole("button", { name: /Mark shipped/ }).click();
await page.getByText("Shipped", { exact: true }).first().waitFor();
await page.screenshot({ path: `${SHOTS}/2-seller-shipped.png` });

step("Courier: advance to delivered with GPS-valid proof (signed webhooks)");
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-role-courier").click();
for (const label of ["In transit", "Out for delivery"]) {
  await page.getByRole("button", { name: new RegExp(`Advance to .${label}.`) }).click();
  await page.waitForTimeout(700); // action -> refresh round-trip
}
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).click();
await page.getByText("Proof on file", { exact: false }).waitFor();
await page.screenshot({ path: `${SHOTS}/3-courier-delivered.png` });

step("Buyer: confirm receipt -> RELEASED by the money core");
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-role-buyer").click();
await page.getByRole("button", { name: "Confirm receipt" }).click();
await page.getByText("Order complete. Payment was released to the seller.").waitFor();
await page.screenshot({ path: `${SHOTS}/4-buyer-released.png` });

step("Admin: trust console + double-entry ledger");
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-role-admin").click();
await page.getByText("Escrow console").waitFor();
await page.getByText(`escrow:${reference}`).first().waitFor();
await page.screenshot({ path: `${SHOTS}/5-admin-console.png`, fullPage: true });

// The numbers must be the backend's, to the paisa.
const trust = await (await fetch(`${API}/api/admin/trust`, { headers: { "X-Role": "admin" } })).json();
console.log(`   backend truth: held=${trust.totalHeldInTrustPaisa} released=${trust.releasedToSellersPaisa} fees=${trust.chartOfAccounts.platform_fee}`);
if (trust.totalHeldInTrustPaisa !== 0) fail("escrow should be empty after release");
if (trust.releasedToSellersPaisa !== 499900 - 2500 - 3000) fail(`unexpected released amount ${trust.releasedToSellersPaisa}`);

step("Seller: withdraw released funds through the payout rail");
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-role-seller").click();
await page.getByRole("button", { name: "Withdraw to bank" }).click();
await page.getByText("Payout initiated via the payment rail").waitFor();
await page.screenshot({ path: `${SHOTS}/6-seller-payout.png` });

const after = await (await fetch(`${API}/api/admin/trust`, { headers: { "X-Role": "admin" } })).json();
console.log(`   after payout: sellerPool=${after.chartOfAccounts.seller_wallet_pool}`);
if (after.chartOfAccounts.seller_wallet_pool !== 0) fail("seller pool should be empty after payout");

await browser.close();
console.log("\nE2E SMOKE PASSED — full lifecycle through the real UI and the real money core.");
