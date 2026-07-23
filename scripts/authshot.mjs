import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

// portal chooser
await page.goto("http://localhost:5173/login");
await page.getByText("Choose your portal").waitFor();
await page.waitForTimeout(700);
await page.screenshot({ path: "scripts/shots/auth-portal-chooser.png" });

// buyer auth: signup toggle exists
await page.goto("http://localhost:5173/buyer-dashboard/login");
await page.getByRole("button", { name: "Sign up", exact: true }).click();
await page.getByRole("button", { name: /Create buyer account/ }).waitFor();
await page.waitForTimeout(400);
await page.screenshot({ path: "scripts/shots/auth-buyer-signup.png" });
await page.getByRole("button", { name: /Create buyer account/ }).click();
await page.waitForURL("**/buyer-dashboard");
console.log("buyer signup → buyer-dashboard ok");

// seller signup
await page.goto("http://localhost:5173/seller-dashboard/login");
await page.getByRole("button", { name: "Sign up", exact: true }).click();
await page.getByPlaceholder("Store URL (Shopify, WooCommerce or custom)").waitFor();
await page.getByRole("button", { name: /Create seller account/ }).click();
await page.waitForURL("**/seller-dashboard");
console.log("seller signup → seller-dashboard ok");

// courier is login-only
await page.goto("http://localhost:5173/courier-dashboard/login");
await page.getByText("provisioned by Sukoon Pay").waitFor();
const signupButtons = await page.getByRole("button", { name: "Sign up", exact: true }).count();
if (signupButtons > 0) throw new Error("courier auth should be login-only");
await page.waitForTimeout(400);
await page.screenshot({ path: "scripts/shots/auth-courier-login.png" });
await page.getByRole("button", { name: "Log in", exact: true }).click();
await page.waitForURL("**/courier-dashboard");
console.log("courier one-step login → courier-dashboard ok");

// admin quick demo login
await page.goto("http://localhost:5173/admin-dashboard/login");
await page.getByTestId("quick-demo-login").click();
await page.waitForURL("**/admin-dashboard");
console.log("admin quick login → admin-dashboard ok");

// buyer 2FA path
await page.goto("http://localhost:5173/buyer-dashboard/login");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: /Verify & log in/ }).click();
await page.waitForURL("**/buyer-dashboard");
console.log("buyer 2FA login → buyer-dashboard ok");

console.log(errors.length ? "ERRORS: " + errors.join("; ") : "no page errors");
await browser.close();
