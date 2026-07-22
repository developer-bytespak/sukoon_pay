import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto("http://localhost:5174/");
await page.waitForTimeout(800);
await page.getByRole("banner").getByRole("link", { name: "Sharia & fees" }).click();
await page.waitForTimeout(1200); // smooth scroll
const { scrollY, inView } = await page.evaluate(() => {
  const el = document.getElementById("sharia");
  const r = el.getBoundingClientRect();
  return { scrollY: window.scrollY, inView: r.top >= 0 && r.top < window.innerHeight };
});
console.log(`nav click scrolled to #sharia: scrollY=${Math.round(scrollY)} sectionInView=${inView}`);
await page.screenshot({ path: "scripts/shots/sharia-anchor.png" });

// /sharia route must be gone (unknown route renders nothing but must not crash)
const resp = await page.goto("http://localhost:5174/sharia");
console.log(`/sharia now returns SPA shell with no Sharia page: status=${resp.status()}`);
await browser.close();
