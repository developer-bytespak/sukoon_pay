// Walks the full demo across the four standalone dashboards and the webhook
// simulation, headlessly, and screenshots each stage.
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5173";
const SHOTS = "scripts/shots";
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && errors.push(`console: ${m.text()}`));

let step = 0;
async function shot(name) {
  step++;
  await page.screenshot({ path: `${SHOTS}/${String(step).padStart(2, "0")}-${name}.png`, fullPage: false });
  console.log(`✓ ${step} ${name}`);
}

// Open the demo gear popover (idempotent) and return it.
async function gear() {
  const panel = page.getByTestId("demo-panel");
  if (!(await panel.isVisible().catch(() => false))) await page.getByTestId("demo-gear").click();
  await panel.waitFor();
  return panel;
}
async function gearRole(role) {
  await gear();
  await page.getByTestId(`demo-role-${role}`).click();
  await page.waitForURL(`**/${role}-dashboard`);
}
async function loginAs(role) {
  await page.goto(`${BASE}/${role}-dashboard/login`);
  await page.getByTestId("quick-demo-login").click();
  await page.waitForURL(`**/${role}-dashboard`);
}

// 1. Landing + integrations section
await page.goto(BASE);
await page.getByText("Shop without fear").waitFor();
await shot("landing");
await page.goto(`${BASE}/#integrations`);
await page.getByText("Live on your store").waitFor();
await shot("landing-integrations");

// 2. Portal chooser
await page.goto(`${BASE}/login`);
await page.getByText("Choose your portal").waitFor();
await shot("portal-chooser");

// 3. Buyer auth with 2FA
await page.getByText("Open buyer portal").click();
await page.waitForURL("**/buyer-dashboard/login");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: /Verify & log in/ }).click();
await page.waitForURL("**/buyer-dashboard");
await shot("buyer-dashboard-empty");

// 4. Seller connects both webhooks and sends a test delivery
await loginAs("seller");
await page.getByTestId("connect-carts").click();
await page.getByTestId("connect-payment").click();
await page.getByText("Connected · Shopify").first().waitFor();
await page.getByTestId("test-payment").click();
await page.getByText("200 delivered").first().waitFor();
await shot("seller-webhooks-connected");

// 5. Abandon a cart on Shopping.pk (two products, one bumped to qty 2)
await page.goto(`${BASE}/store`);
await page.getByText("Shopping.pk").first().waitFor();
await page.getByTestId("add-sneakers").click();
await page.getByText("1 in cart").waitFor();
await page.getByTestId("add-headphones").click();
await shot("store-add-to-cart");

// 6. The pending cart arrives in the seller dashboard
await page.goto(`${BASE}/seller-dashboard`);
await page.getByText(/CART-\d+/).first().waitFor();
await page.getByText("Send WhatsApp nudge").waitFor();
await shot("seller-pending-cart");

// 7. Buy the cart via Sukoon Pay (recovers it)
await page.goto(`${BASE}/store`);
await page.getByTestId("cart-button").click();
await page.getByTestId("cart-drawer").waitFor();
await shot("store-cart-drawer");
await page.getByTestId("pay-sukoon").click();
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: "Verify" }).click();
await page.getByRole("button", { name: /Confirm & pay into escrow/ }).click();
await page.waitForURL("**/buyer-dashboard");
await page.getByText("held safely in trust").first().waitFor();
await shot("buyer-order-in-escrow");

// 8. Seller sees the order in escrow, the payment event, the recovered cart; ships it
await loginAs("seller");
await page.getByText("In Escrow · pending").first().waitFor();
await page.getByText("✓ Recovered").waitFor();
await page.getByText("orders/paid").first().waitFor();
await shot("seller-order-and-recovered-cart");
await page.getByRole("button", { name: /Mark shipped/ }).click();

// 9. Courier walks the parcel to Delivered with valid proof
await gearRole("courier");
await page.getByRole("button", { name: /In transit/ }).click();
await page.getByRole("button", { name: /Out for delivery/ }).click();
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).click();
await page.getByText("Inspection window").first().waitFor();
await shot("courier-delivered");

// 10. Buyer inspection window, fast-forward 7 days, auto-release
await gearRole("buyer");
await page.getByText(/Inspection: .*left/).waitFor();
await shot("buyer-inspection-window");
await gear();
await page.getByTestId("demo-jump-7d").click();
await page.getByText("Order complete. Payment was released").waitFor();
await shot("buyer-auto-released");

// 11. Admin console: trust totals + ledger
await gearRole("admin");
await page.getByText("Double-entry ledger (fake money, real arithmetic)").waitFor();
await shot("admin-ledger");

// 12. Scenario 3: not received → dispute → four-eyes refund
await gear();
await page.getByTestId("demo-scenario").selectOption("3");
await gearRole("buyer");
await page.getByRole("button", { name: "Report a problem" }).click();
await page.getByText("I never received this order").waitFor();
await page.getByRole("button", { name: "Submit dispute" }).click();
await page.getByText(/Awaiting adjudication: 0\/2/).waitFor();
await gearRole("admin");
await page.getByRole("button", { name: /Approve as Sara/ }).click();
await page.getByText(/\(1\/2\)/).waitFor();
await page.getByRole("button", { name: /Approve as Hamza/ }).click();
await page.getByText(/Resolved: refunded to buyer/).waitFor();
await shot("admin-four-eyes-refunded");

// 13. Scenario 6: suspicious proof → flagged & held
await gear();
await page.getByTestId("demo-scenario").selectOption("6");
await gearRole("courier");
await page.getByRole("button", { name: /GPS match: ON/ }).click();
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).click();
await page.getByText("Held for review").first().waitFor();
await shot("courier-flagged");
await gearRole("admin");
await page.getByText("suspicious proof").first().waitFor();
await shot("admin-flagged-queue");

// 14. Scenario 5: seller never ships → +3d → auto-refund
await gear();
await page.getByTestId("demo-scenario").selectOption("5");
await gear();
await page.getByTestId("demo-jump-3d").click();
await gearRole("buyer");
await page.getByText("returned in full from trust").waitFor();
await shot("buyer-auto-refunded");

if (errors.length) {
  console.error("\nBrowser errors:");
  errors.forEach((e) => console.error("  " + e));
  process.exitCode = 1;
} else {
  console.log("\nAll flows verified in browser — no console errors.");
}
await browser.close();
