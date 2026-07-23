import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();

// seller quick login, connect the carts webhook, abandon a cart
await page.goto("http://localhost:5173/seller-dashboard/login");
await page.getByTestId("quick-demo-login").click();
await page.waitForURL("**/seller-dashboard");
await page.getByTestId("connect-carts").click();
await page.getByText(/Connected ·/).first().waitFor();
await page.goto("http://localhost:5173/bazaar");
await page.getByRole("button", { name: "Add to cart" }).click();
await page.getByText(/Saved to cart/).waitFor();
await page.goto("http://localhost:5173/seller-dashboard");
await page.getByText(/CART-\d+/).first().waitFor();

// reload: role, integration and cart all survive
await page.reload();
await page.getByText(/CART-\d+/).first().waitFor();
await page.getByText(/Connected ·/).first().waitFor();
console.log("✓ integration + pending cart survived a page refresh (localStorage persistence)");

// reset clears everything and logs out
await page.getByTestId("demo-gear").click();
await page.getByTestId("demo-reset").click();
await page.getByText("Shop without fear").waitFor(); // back on landing
await page.goto("http://localhost:5173/seller-dashboard");
await page.waitForURL("**/seller-dashboard/login"); // guard bounced: role cleared
console.log("✓ Reset demo cleared state and logged out (guard redirects to seller login)");
await browser.close();
