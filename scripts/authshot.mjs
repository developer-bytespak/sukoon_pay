import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://localhost:5174/login");
await page.waitForTimeout(900);
await page.screenshot({ path: "scripts/shots/auth-login.png" });

await page.getByRole("button", { name: "Sign up", exact: true }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: "scripts/shots/auth-signup.png" });

// exercise the flows: signup as seller
await page.getByRole("button", { name: /I'm a Seller/ }).click();
await page.getByRole("button", { name: "Create account" }).click();
await page.waitForURL("**/seller");
console.log("signup → seller ok");

// login flow with 2FA
await page.goto("http://localhost:5174/login");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByPlaceholder("••••••").fill("000000");
await page.getByRole("button", { name: /Verify & log in/ }).click();
await page.waitForURL("**/buyer");
console.log("login 2FA → buyer ok");

// quick launch
await page.goto("http://localhost:5174/login");
await page.getByRole("button", { name: "Admin", exact: true }).click();
await page.waitForURL("**/admin");
console.log("quick-launch admin ok");

console.log(errors.length ? "ERRORS: " + errors.join("; ") : "no page errors");
await browser.close();
