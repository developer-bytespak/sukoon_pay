import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto("http://localhost:5174/");
const bar = page.locator("div.fixed.inset-x-0.bottom-0");

for (const role of ["Buyer", "Seller", "Admin", "Courier"]) {
  await bar.getByRole("button", { name: role, exact: true }).click();
  await page.waitForTimeout(600);
  const active = await bar.locator("button.bg-emerald-600").allTextContents();
  console.log(`clicked ${role} → url=${new URL(page.url()).pathname} active chip=${JSON.stringify(active)}`);
}
await browser.close();
