import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:5174/");
await page.waitForTimeout(800);

for (const sel of ["#how", "#why", "#sharia"]) {
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1400);
  const opacity = await page.locator(`${sel} h2`).first().evaluate((el) => {
    const target = el.closest("[style]") ?? el;
    return getComputedStyle(target).opacity;
  });
  console.log(`${sel} h2 wrapper opacity: ${opacity}`);
  await page.screenshot({ path: `scripts/shots/section-${sel.slice(1)}.png` });
}
await browser.close();
