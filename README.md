# Sukoon Pay — Demo MVP

**سکون — peace of mind** · Escrow-based buyer protection & instant merchant settlement for Pakistan's e-commerce.

This is a **demonstration MVP**: a fully client-side, clickable prototype. A single Zustand store acts as the simulated backend — real escrow arithmetic, double-entry ledger, simulated webhooks, fake money. No server, no real auth, no real payments.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

Deploy: static host (Vercel/Netlify). `vercel.json` includes the SPA rewrite.

## The four dashboards

Each role has its own portal with its own login page (dark theme, coordinated with the landing page). The portal chooser lives at `/login`.

| Route | Role | Auth |
|---|---|---|
| `/buyer-dashboard` | Buyer: protected orders, inspection windows, confirm/dispute | login + signup, 2FA demo code `000000` |
| `/seller-dashboard` | Seller: escrow balances, orders, **pending carts**, **webhook integrations**, event log | login + signup |
| `/courier-dashboard` | Courier (TCS partner ops): shipments, proof capture, GPS toggle | login only |
| `/admin-dashboard` | Admin: trust totals, four-eyes dispute queue, ledger, chart of accounts | login only |

Every auth page has a **Quick demo login** button. Dashboards are role-guarded: visiting one without the role redirects to its login.

## Webhook simulation

Two webhooks connect a store to Sukoon Pay (simulated end to end, modeled on real platform mechanics):

- **Checkout payment webhook** — Shopify `orders/paid` · WooCommerce `order.created` · custom `payment.succeeded`. Fires when a buyer pays with Sukoon Pay; the order lands in the seller dashboard already held in escrow.
- **Pending carts webhook** — Shopify `checkouts/update` · WooCommerce `cart.abandoned` · custom `cart.pending`. Streams abandoned carts into the seller dashboard's Pending carts section.

Connect them in the seller dashboard's Integrations section (per-platform setup snippets, endpoint + HMAC secret, test deliveries, live event log). Carts are only captured while the webhook is connected; missed events are counted as the reason to connect. Try it: connect the carts webhook, add products to the cart on `/store` without paying, watch the cart arrive; then pay and watch it flip to Recovered.

## Shopping.pk demo store

`/store` is the fake partner storefront (deliberately not Sukoon-branded): 8 products with real photos, ratings, a multi-item cart drawer with quantity controls, and the COD vs "Pay with Sukoon Pay (Protected)" choice at the cart. Checkout of the whole cart creates one escrowed order.

## Driving the demo

The **demo gear** (settings icon in every dashboard header) holds the presenter tools: scenario storylines (6), the fast-forward clock (+12h/+1d/+3d/+7d — this is how the 7-day auto-release and 3-day auto-refund are demonstrated live), role switcher, and Reset. State persists across refreshes via localStorage.

## Verification scripts

- `npx tsx scripts/smoke.ts` — engine checks: all 6 scenarios, four-eyes gate, ledger balance, webhook/cart flows
- `node scripts/verify.mjs` — headless 17-step browser walkthrough (needs the dev server; uses system Edge via Playwright)
- `node scripts/persistcheck.mjs` · `node scripts/overflowcheck.mjs` · `node scripts/authshot.mjs`

## Structure

- `src/engine/` — the simulated backend: state machine transitions, tiered Wakala fees, double-entry ledger, demo clock, scenario seeds, webhook/cart simulation, Zustand store (persist v1 with migration)
- `src/pages/` — Landing (Sharia at `/#sharia`, integrations at `/#integrations`), PortalChooser, RoleAuth, Shopping.pk storefront (`Store.tsx`), Sukoon checkout, `dashboards/` (Buyer, Seller, Courier, Admin)
- `src/components/` — shared light/dark (`tone`) components: state pills, ledger table, timeline, state-machine diagram; `dashboard/` shell, demo gear, glass primitives, integrations section
