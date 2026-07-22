import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
// same squat window as the user's screenshot, plus mobile
for (const [name, viewport] of [
  ["squat", { width: 1280, height: 552 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport });
  for (const path of ["/login", "/signup", "/", "/bazaar", "/buyer", "/seller", "/courier", "/admin", "/sharia"]) {
    await page.goto(`http://localhost:5174${path}`);
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    if (overflow > 0) console.log(`✗ ${name} ${path}: ${overflow}px horizontal overflow`);
    else console.log(`✓ ${name} ${path}`);
  }
  await page.close();
}
await browser.close();
