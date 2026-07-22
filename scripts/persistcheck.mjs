import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage();
const bar = () => page.locator("div.fixed.inset-x-0.bottom-0");

await page.goto("http://localhost:5174/buyer");
await bar().locator("select").selectOption("1");
await bar().getByRole("button", { name: "Seller", exact: true }).click();
await page.getByText("In Escrow — pending").first().waitFor();

await page.reload();
await page.getByText("In Escrow — pending").first().waitFor();
console.log("✓ order survived a page refresh (localStorage persistence)");

await bar().getByRole("button", { name: /Reset demo/ }).click();
await page.getByText("Shop without fear").waitFor(); // back on landing
await page.goto("http://localhost:5174/seller");
await page.getByText("No orders yet").waitFor();
console.log("✓ Reset demo cleared all state");
await browser.close();
