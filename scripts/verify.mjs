// Walks the spec's Definition-of-Done checklist headlessly and screenshots each stage.
import { chromium } from "playwright";
import { mkdirSync } from "fs";

const BASE = process.env.BASE_URL ?? "http://localhost:5174";
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
const demoBar = () => page.locator("div.fixed.inset-x-0.bottom-0");

// 1. Landing
await page.goto(BASE);
await page.getByText("Shop without fear").waitFor();
await shot("landing");

// 2. Buy on Bazaar.pk via Sukoon Pay
await page.goto(`${BASE}/bazaar`);
await page.getByText("Pay with Sukoon Pay (Protected)").click();
await page.getByText("Sukoon Pay Consumer ID").waitFor();
await shot("checkout-consumer-id");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: "Verify" }).click();
await page.getByText("Wakala (agency) fee").first().waitFor();
await shot("checkout-fee-breakdown");
await page.getByRole("button", { name: /Confirm & pay into escrow/ }).click();

// 3. Buyer view — order in escrow
await page.getByText("held safely in trust").first().waitFor();
await shot("buyer-held-in-escrow");

// 4. Seller sees "In Escrow — pending", marks shipped
await demoBar().getByRole("button", { name: "Seller", exact: true }).click();
await page.getByText("In Escrow — pending").first().waitFor();
await shot("seller-escrow-pending");
await page.getByRole("button", { name: /Mark shipped/ }).click();

// 5. Courier walks to Delivered with proof (GPS on)
await demoBar().getByRole("button", { name: "Courier", exact: true }).click();
await page.getByRole("button", { name: /In transit/ }).click();
await page.getByRole("button", { name: /Out for delivery/ }).click();
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).waitFor();
await shot("courier-proof-form");
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).click();
await page.getByText("Inspection window").first().waitFor();

// 6. Buyer inspection window, fast-forward → auto-release
await demoBar().getByRole("button", { name: "Buyer", exact: true }).click();
await page.getByText(/Inspection: .*left/).waitFor();
await shot("buyer-inspection-window");
await demoBar().getByRole("button", { name: "+7d" }).click();
await page.getByText("Order complete — payment was released").waitFor();
await shot("buyer-auto-released");

// 7. Seller balance moved to Released
await demoBar().getByRole("button", { name: "Seller", exact: true }).click();
await page.getByText("Released (withdrawable)").waitFor();
await shot("seller-released");

// 8. Admin console — ledger + total in trust
await demoBar().getByRole("button", { name: "Admin", exact: true }).click();
await page.getByText("Total held in trust").waitFor();
await page.getByText("Double-entry ledger", { exact: false }).waitFor();
await shot("admin-ledger");

// 9. Scenario 3: not received → dispute → four-eyes refund
await demoBar().locator("select").selectOption("3");
await demoBar().getByRole("button", { name: "Buyer", exact: true }).click();
await page.getByRole("button", { name: "Report a problem" }).click();
await page.getByText("I never received this order").waitFor();
await shot("buyer-dispute-form");
await page.getByRole("button", { name: "Submit dispute" }).click();
await page.getByText(/Awaiting adjudication — 0\/2/).waitFor();
await demoBar().getByRole("button", { name: "Admin", exact: true }).click();
await page.getByText("Dispute queue").waitFor();
await shot("admin-dispute-queue");
await page.getByRole("button", { name: /Approve as Sara/ }).click();
await page.getByText(/two distinct approvers \(1\/2\)/).waitFor();
await page.getByRole("button", { name: /Approve as Hamza/ }).click();
await page.getByText(/Resolved: refunded to buyer/).waitFor();
await shot("admin-four-eyes-refunded");

// 10. Sharia panel
await page.goto(`${BASE}/sharia`);
await page.getByText("Buyer protection is NOT insurance").waitFor();
await shot("sharia-panel");

// 11. Scenario 6: suspicious proof → flagged & held
await demoBar().locator("select").selectOption("6");
await demoBar().getByRole("button", { name: "Courier", exact: true }).click();
await page.getByRole("button", { name: /GPS match: ON/ }).click();
await page.getByRole("button", { name: /Submit .Delivered. \+ proof/ }).click();
await page.getByText("Held for review").first().waitFor();
await shot("courier-flagged");
await demoBar().getByRole("button", { name: "Admin", exact: true }).click();
await page.getByText("suspicious proof").first().waitFor();
await shot("admin-flagged-queue");

// 12. Scenario 5: never ships → +3d → auto-refund
await demoBar().locator("select").selectOption("5");
await demoBar().getByRole("button", { name: "+3d" }).click();
await demoBar().getByRole("button", { name: "Buyer", exact: true }).click();
await page.getByText("returned in full from trust").waitFor();
await shot("buyer-auto-refunded");

if (errors.length) {
  console.error("\nBrowser errors:");
  errors.forEach((e) => console.error("  " + e));
  process.exitCode = 1;
} else {
  console.log("\nAll DoD flows verified in browser — no console errors.");
}
await browser.close();
