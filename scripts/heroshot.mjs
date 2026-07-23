import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
await page.goto("http://localhost:5173/");
await page.waitForTimeout(2200);
await page.screenshot({ path: "scripts/shots/hero-new.png" });
console.log("done");
await browser.close();
