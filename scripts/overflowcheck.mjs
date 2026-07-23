import { chromium } from "playwright";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/bazaar",
  "/buyer-dashboard/login",
  "/seller-dashboard/login",
  "/courier-dashboard/login",
  "/admin-dashboard/login",
];
const DASHBOARDS = ["buyer", "seller", "courier", "admin"];

const browser = await chromium.launch({ channel: "msedge", headless: true });

for (const [name, viewport] of [
  ["squat", { width: 1280, height: 552 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport });
  const measure = async (label) => {
    await page.waitForTimeout(450);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    console.log(overflow > 0 ? `✗ ${name} ${label}: ${overflow}px horizontal overflow` : `✓ ${name} ${label}`);
  };
  for (const path of PUBLIC_PATHS) {
    await page.goto(`http://localhost:5173${path}`);
    await measure(path);
  }
  // dashboards sit behind the role guard: quick-login through each auth page first
  for (const role of DASHBOARDS) {
    await page.goto(`http://localhost:5173/${role}-dashboard/login`);
    await page.getByTestId("quick-demo-login").click();
    await page.waitForURL(`**/${role}-dashboard`);
    await measure(`/${role}-dashboard`);
  }
  await page.close();
}
await browser.close();
