# Sukoon Pay · Dashboard Guide

**سکون · peace of mind**

Documentation for the four role dashboards in the Sukoon Pay demo: what each screen contains, what every section displays, and how users interact with it.

---

## 1. How the dashboards fit together

Sukoon Pay has four standalone dashboards, one for each side of an escrowed transaction:

| Dashboard | URL | Who it serves |
|---|---|---|
| Buyer | `/buyer-dashboard` | The consumer who paid into escrow |
| Seller | `/seller-dashboard` | The merchant whose store is connected |
| Courier | `/courier-dashboard` | The delivery partner (TCS in the demo) |
| Admin | `/admin-dashboard` | Sukoon Pay's internal escrow operations team |

All four are views over **one shared engine** (a simulated backend in the browser). An action on any dashboard updates the others instantly: when the courier marks a parcel delivered, the buyer's tracker advances, the seller sees the inspection countdown, and the admin's state machine highlights the new state. That live cause and effect is the core of the demo.

State persists in the browser (localStorage), so a page refresh never loses progress. Use Reset (section 3.2) for a clean slate.

---

## 2. Getting in

### 2.1 Portal chooser (`/login`)

The landing page's Log in and Sign up buttons lead to a chooser with four cards, one per role. Each card names the role, summarizes what its portal is for, and links to that portal's own login page.

### 2.2 Per-role auth pages (`/<role>-dashboard/login`)

Every dashboard has its own login page in the split-screen style: brand imagery and role-specific feature bullets on the left, the form on the right.

- **Buyer** and **Seller** have a Log in / Sign up toggle. Buyer login includes a mock two-factor step (any credentials work; the 2FA demo code is `000000`). Seller signup asks for a store name and store URL.
- **Courier** and **Admin** are login-only. These are partner and internal accounts, provisioned by Sukoon Pay.
- Every auth page has a **Quick demo login** button that skips the form entirely. This is the fastest way into any dashboard during a pitch.

### 2.3 Role guard and logout

Each dashboard is protected by a role guard: opening `/seller-dashboard` without being logged in as the seller redirects to the seller login. The logout button (top-right of every dashboard) clears the session and returns to that dashboard's login page. A buyer completing checkout on the demo store is logged in automatically and lands on the buyer dashboard.

---

## 3. Shared elements on every dashboard

### 3.1 The shell

- **Top bar**: Sukoon Pay logo (links home), a colored role chip (buyer emerald, seller teal, courier amber, admin violet), section navigation links that scroll to each section of the page, a context badge (for example the buyer's wallet balance or the admin's total held in trust), the demo gear, and logout.
- **KPI row**: every dashboard opens with three or four stat tiles summarizing that role's world at a glance. The tiles recalculate live from the ledger, never from cached numbers.

### 3.2 The demo gear (presenter tools)

The gear icon in the top bar opens a popover with the tools a presenter needs:

| Tool | What it does |
|---|---|
| **Scenario storyline** | Loads one of six pre-seeded storylines (happy path, silent buyer, not received, defective, seller never ships, suspicious proof). A hint appears describing which buttons to press to play it out. Loading a scenario replaces orders, carts and events but keeps webhook connections, so the seller does not need to reconnect between storylines. |
| **Simulated clock** | Shows the current simulated date and fast-forwards it by +12h, +1d, +3d or +7d. This is how the timers are demonstrated live: the 7-day inspection window auto-releases and the 3-day no-ship timer auto-refunds when the clock passes them. |
| **View as** | Instantly switches to any of the four dashboards, logging in as that role. Used to show all sides of one transaction in seconds. |
| **Open store** | Jumps to the Shopping.pk demo storefront. |
| **Reset demo** | Wipes everything back to a clean slate: orders, balances, carts, webhook connections, event log, scenario, clock, and the login session. |

### 3.3 Order status pills

The same status pills appear on every dashboard so one vocabulary carries across roles:

| Pill | Meaning |
|---|---|
| In Escrow · pending | Buyer paid; money is held in trust; seller has not shipped yet (3-day no-ship timer running) |
| Shipped | Seller handed the parcel to the courier |
| Inspection window | Courier delivered with valid proof; the buyer has 7 days to confirm or object |
| Released | Funds settled to the seller (confirmed, auto-released, or adjudicated) |
| Disputed · frozen | Buyer reported a problem; nobody can touch the money until adjudication |
| Refunded / Auto-refunded | Buyer's own funds returned in full from trust |
| ⚠ Held for review | Courier claimed delivery with weak proof (no GPS match); the order is frozen for manual review |

---

## 4. Buyer dashboard (`/buyer-dashboard`)

The consumer's home. Everything here answers one question: where is my money, and where is my order?

**KPI row**
- **Wallet balance**: the buyer's demo wallet (starts at PKR 25,000; debited on payment, credited on refunds).
- **Held in escrow for you**: money currently sitting in trust for active orders, with the reminder that it returns in full if delivery fails.
- **Completed orders**: count of finished orders, with how many are active now.

**Orders section**. One card per order, newest first:
- A six-step tracker: Paid → Shipped → Out for delivery → Delivered → Inspection → Released/Refunded. The Inspection step shows a live countdown (for example "Inspection: 6d 22h left").
- A trust line while money is held: "Your money is held safely in trust (Amanah) by Sukoon Pay until you confirm."
- During the inspection window, two buttons appear:
  - **Confirm receipt**: releases the funds to the seller immediately.
  - **Report a problem**: opens the dispute form with two reasons ("I never received this order" or "Item is defective / not as described", with a mock photo-evidence attach). Submitting freezes the funds and sends the case to admin adjudication. The form states the published-rules principle and the fixed PKR 150 adjudication service fee.
- If a dispute exists, the card shows the exact published rule being applied and the approval progress ("Awaiting adjudication: 1/2 approvals (four-eyes)"), then the resolution.
- On completion the card shows a closing banner: released ("Order complete. Payment was released to the seller.") or refunded ("Your own funds were returned in full from trust. No premium, no pool, no insurance.").
- An expandable **Order timeline** lists every event with simulated timestamps.

**Order history section**: a compact list of finished orders with product thumbnail, amount, completion date and final status pill.

**Empty state**: a "Shop on Shopping.pk" button that opens the demo store.

---

## 5. Seller dashboard (`/seller-dashboard`)

The merchant's money story, plus the store integration surface. Header banner: "Paid on delivery, not in 30 days."

**KPI row**
- **In escrow (pending)**: value of orders held in trust, releasing on confirmed delivery.
- **Released (withdrawable)**: settled funds the seller can withdraw.
- **Orders**: count of orders taken through Sukoon Pay checkout.
- **Pending carts**: open abandoned carts and their recoverable value.

**Payouts card**: the withdrawable balance with a mock **Withdraw to bank** button (same-day transfer note).

**Orders section**. One row per order: product thumbnail, order id, amount, placement time, and the status pill. Live deadline chips appear inline:
- "ship within 2d 16h left or auto-refund" while the no-ship timer runs, next to the **Mark shipped · attach tracking** button (clicking it hands the parcel to the courier with a mock tracking number).
- "auto-release in 6d 22h" during the buyer's inspection window.

**Pending carts section**. Carts customers filled but never paid for, streamed in by the pending carts webhook:
- Each row shows the cart id, items with quantities, the masked customer email, value, and how long ago it was abandoned.
- Status chips: **Open** (recoverable), **Nudge sent** (after clicking the mock **Send WhatsApp nudge** button), **✓ Recovered** (the customer came back and paid; flips automatically).
- If the carts webhook is not connected, this section shows an empty state with the count of carts that were missed while disconnected and a link to Integrations. That absence is the pitch for connecting.

**Integrations section**. Two webhook cards, each connectable independently:

| Card | Purpose | Topics per platform |
|---|---|---|
| **Checkout payment webhook** | Orders paid with Sukoon Pay land here instantly, already in escrow | Shopify `orders/paid` · WooCommerce `order.created` · custom `payment.succeeded` |
| **Pending carts webhook** | Streams abandoned checkouts into the Pending carts section | Shopify `checkouts/update` · WooCommerce `cart.abandoned` · custom `cart.pending` |

Each card offers, before connecting: platform tabs (Shopify, WordPress · WooCommerce, Custom store) with a realistic setup snippet for that platform, and a **Connect** button. After connecting: the generated endpoint URL and `whsec_` secret with copy buttons, the connection timestamp, **Send test delivery**, and **Disconnect**. Deliveries are described as HMAC-SHA256 signed, matching how the real platforms sign webhooks.

**Webhook event log**. Every delivery, newest first: a status chip (`200 delivered` or `skipped · not connected`), the topic, the platform, a `test` badge for test deliveries, the event id and timestamp. Each row expands to show the full JSON payload and the signature header. Adding to a cart on the store delivers the full cart snapshot (the same semantics as Shopify's `checkouts/update`); paying delivers the payment event.

---

## 6. Courier dashboard (`/courier-dashboard`)

The delivery partner's ops console, co-branded with a TCS chip. This is the surface that drives most of the escrow engine during a demo.

**KPI row**: active shipments, delivered count, GPS-verified percentage of delivered parcels, and how many are flagged for review.

**Shipments section**. One card per shipment:
- A four-step progress stepper: Picked up → In transit → Out for delivery → Delivered.
- An **Advance** button moves the parcel one step at a time.
- At the final step, a **proof of delivery form** appears: choose the proof type (Photo, OTP, or Signature) and toggle **GPS match ON/OFF**, then **Submit "Delivered" + proof**.
  - With GPS on, Sukoon Pay accepts the proof and opens the buyer's 7-day inspection window.
  - With GPS off, the delivery is **flagged and held**: no inspection window opens, no money moves, and the order lands in the admin's review queue. This demonstrates that Sukoon Pay verifies couriers rather than trusting them.
- After delivery, the card records the proof on file (type, value, GPS result).
- Each row notes "COD value: none (prepaid via Sukoon Pay)": escrowed orders carry no cash for the rider.

**Awaiting seller handover section**: paid orders the seller has not shipped yet, so the courier can see what is coming.

---

## 7. Admin dashboard (`/admin-dashboard`)

Sukoon Pay's internal escrow console. This screen makes the trust structure visible.

**KPI row**
- **Total held in trust (Amanah)**: the sum of every open escrow account, labeled "Segregated · never invested". Also pinned as a badge in the top bar.
- **Released to sellers**: cumulative settled funds.
- **Open disputes**: cases waiting on four-eyes approval.
- **Held for review**: deliveries flagged for suspicious proof.

**Adjudication queues section**. Two kinds of cases:

- **Flagged delivery cards** (suspicious proof): show the courier's claimed proof and why it failed (GPS match: NO). Two actions: **Accept proof → open inspection window** (manual review cleared it) or **Reject proof → refund buyer**.
- **Dispute cards**: show the claim type (non-receipt or defective), three evidence panels (buyer evidence, seller/courier evidence, and the **published rule applied**, for example "Rule R2: Non-receipt claim and courier proof lacks photo or GPS corroboration: refund buyer"), the deterministic outcome, and the fixed adjudication service fee note.
  - Resolution requires **four-eyes approval**: two separate approver buttons (Sara and Hamza). The first click records an approval; money moves only on the second, and the same approver cannot click twice. The card then shows who approved and the outcome.

**Trust accounts section**
- **Per-order escrow accounts**: one `escrow:SP-xxxxx` account per order with its live balance. Clicking a row selects that order in the inspector.
- **Chart of accounts**: `platform_fee` (Wakala + verification fees earned), `purification` (the charity account for any inadvertent non-halal income), `seller_wallet`, and `buyer_wallet`, each with its balance.

**Order inspector section**. For the selected order:
- The **state machine diagram** with the current state highlighted, including the branch paths (dispute, auto-refund).
- The **double-entry ledger**: every DR/CR pair with account, amount, memo and timestamp. New entries animate in as money moves. Debits always equal credits.
- An expandable **audit timeline** of every event on the order.

---

## 8. Where the data comes from

- The **Shopping.pk demo store** (`/store`) is the on-ramp: 8 products, a multi-item cart drawer, and the choice between Cash on Delivery and "Pay with Sukoon Pay (Protected)". Paying creates the escrowed order that then flows through all four dashboards. Adding to the cart without paying creates the abandoned cart the seller sees.
- The **six scenario storylines** in the demo gear seed the same engine at interesting starting points, so any edge case can be demonstrated without replaying the whole journey.
- All money is fake and all arithmetic is real: the ledger balances, the fees follow the published Wakala tiers (PKR 25 / 75 / 200 / capped 400 plus the PKR 30 verification fee), and refunds always return the buyer's full amount.

---

*Demonstration prototype. See `Sukoon-Pay-1-Business-Logic.md` for the business and Sharia structure and `Sukoon-Pay-2-MVP-Build-Spec.md` for the original build specification.*
