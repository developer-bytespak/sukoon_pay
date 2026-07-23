import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });

for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 900 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:5173/");
  await page.waitForTimeout(1500);
  // slow scroll so every whileInView reveal fires before the stitched capture
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 450) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 380));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `scripts/shots/landing-${name}.png`, fullPage: true });
  console.log(`${name} done${errors.length ? " ERRORS: " + errors.join("; ") : ""}`);
  await page.close();
}
await browser.close();
