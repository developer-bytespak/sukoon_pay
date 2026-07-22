import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
await page.goto("http://localhost:5174/");
await page.waitForTimeout(1500);
await page.screenshot({ path: "scripts/shots/00-landing-settled.png", fullPage: true });
console.log("done");
await browser.close();
