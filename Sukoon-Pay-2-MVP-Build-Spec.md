# Sukoon Pay — MVP Design & Build Specification

**سکون — peace of mind**

*An interactive, clickable frontend prototype*

**Document 2 of 2** · Version 1.0 · For Designers & Developers · Confidential

---

This document specifies exactly what to build for the Sukoon Pay demonstration MVP: scope, architecture, screens, the state engine, scenarios, and build order. It is written to be handed directly to developers.

---

## 1. What We Are Building (and What We Are NOT)

This is a **demonstration MVP** — a polished, interactive, clickable frontend prototype whose job is to show investors, clients, and stakeholders how Sukoon Pay looks and works. It is roughly "5–10% designed": convincing and fully clickable, but not production software.

### ✅ IN SCOPE

- A polished, interactive, clickable frontend (feels like a real product)
- A **simulated backend inside the frontend** — one in-memory state store with real escrow logic (real arithmetic, fake money)
- A **mock courier engine** the presenter can drive manually (advance shipment status, upload proof)
- A **scenario switcher** to play out all the major edge cases on demand
- Four synchronized views: Buyer, Seller, Courier, Admin/Escrow
- A thin fake storefront ("Bazaar.pk") as the on-ramp
- Landing page, hollow login/signup, and the Sharia + fee panels

### ❌ OUT OF SCOPE (do NOT build)

- No real backend, database, or server
- No real authentication (login is theatrical — any credentials work)
- No real payment, Raast, bank, or courier API integrations — all mocked
- No production security, scalability, or PCI concerns
- No full e-commerce store (one product page only)
- No settings pages, transaction histories, KYC uploads, or other "PayPal-like" screens that don't advance the core story

> **The guiding rule:** the demo is the **escrow**, not the shopping and not the auth. Every hour goes to making the escrow mechanics vivid and clickable. If a screen doesn't advance one of the four themes — **buyer protection · fast settlement · escrow · Sharia** — it isn't in this build.

---

## 2. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **React + Vite + TypeScript** | Fast, deploys as a static site, opens instantly in a meeting |
| Styling | **Tailwind CSS** | Rapid, consistent, polished |
| State | **Zustand** (or React Context) | One central store = the "simulated backend" |
| Animation | **Framer Motion** | For the ledger money-movement and state transitions — this is what makes escrow legible |
| Persistence | **localStorage** | So a demo survives a refresh. Optional. |
| Icons | **lucide-react** | |
| Routing | **React Router** | Landing → auth → role dashboards; plus the store route |
| Deployment | Static host (Vercel / Netlify) | No server needed |

> **This is an ideal project to build with an AI coding tool.** Because no real money moves and there is no production ledger to corrupt, the usual risks of AI-generated financial code do not apply here. Generate freely.

---

## 3. Architecture — The Simulated Backend

The whole app runs in the browser. A single state store *is* the backend. The magic of the demo is that one action (e.g. the courier marking "delivered") instantly and visibly updates every other view — buyer, seller, and escrow console all react in real time. That live cause-and-effect is the demonstration.

```
   ┌──────────────────────────────────────────────────────────────┐
   │                    CENTRAL STATE STORE                       │
   │   (Zustand — the "simulated backend", in memory)             │
   │                                                              │
   │   orders[]      escrowLedger[]     users[]     disputes[]    │
   │   currentUser   scenario           clock                     │
   │                                                              │
   │   actions: pay() shipOrder() courierUpdate() confirmReceipt()│
   │            reportProblem() releaseEscrow() refund()          │
   │            adjudicate() advanceClock() loadScenario()        │
   └───────────────────────────┬──────────────────────────────────┘
                               │ every view subscribes; all update live
        ┌──────────────┬───────┴───────┬──────────────┬─────────────┐
        ▼              ▼               ▼              ▼             ▼
    Bazaar.pk       Buyer           Seller         Courier       Admin /
    storefront      view            dashboard      panel         Escrow console
```

### 3.1 The core data model

```
Order {
  id: string                 // "SP-10294"
  productName, productImage, amount
  buyerId, sellerId
  state: OrderState          // see the state enum below
  paymentMethod: "sukoon" | "cod"
  wakalaFee, verificationFee // computed, shown transparently
  courier: {
    name, trackingId,
    status: "picked_up"|"in_transit"|"out_for_delivery"|"delivered"
    proof: { type: "otp"|"photo"|"signature", value, gpsMatch: bool } | null
  }
  inspectionWindowEndsAt: timestamp | null
  dispute: { reason, buyerEvidence, sellerEvidence, resolution } | null
  ledgerEntries: LedgerEntry[]
  timeline: TimelineEvent[]   // for the buyer's tracker & audit view
}

OrderState =
  CREATED | HELD_IN_ESCROW | SHIPPED | INSPECTION_WINDOW |
  DISPUTED | RELEASED | REFUNDED | AUTO_REFUNDED | CANCELLED

LedgerEntry {                 // real double-entry, fake money
  txnId, account, direction: "DR"|"CR", amount, timestamp
}
// Accounts: buyer_wallet | escrow:{orderId} | seller_wallet
//           platform_fee | purification
```

> **Even in the mock, model the ledger as real double-entry and include a `purification` account.** It costs nothing now and it makes the escrow console demonstrably "real" — investors can watch DR/CR entries animate. It also mirrors the production design in Document 1, so the demo is architecturally honest.

---

## 4. The State Engine & Scenarios

The engine is the hard 20% of this build. Get it right first; every screen is just a view onto its state. The presenter drives it two ways: (a) manually, via the courier panel and buyer buttons, or (b) via the **scenario switcher**, which loads a pre-scripted storyline.

### 4.1 The six demo scenarios

| # | Scenario | Scripted flow | Demonstrates |
|---|---|---|---|
| 1 | **Happy path** | Pay → ship → deliver (valid proof) → buyer confirms → release | The baseline; instant settlement |
| 2 | **Silent buyer** | Pay → ship → deliver → buyer never acts → window expires → auto-release | Seller **always** gets paid (differentiator #2) |
| 3 | **Not received** | Pay → ship → "delivered" → buyer disputes → adjudication → refund | Buyer protection (differentiator #1); anti-PayPal |
| 4 | **Defective / SNAD** | Pay → ship → deliver → buyer reports problem w/ photo → return → refund | "Poor quality product" protection |
| 5 | **Seller never ships** | Pay → 3-day timer expires → auto-refund | Protection from seller inaction |
| 6 | **Suspicious proof** | Pay → ship → "delivered" but no GPS/photo → flagged, held (not released) | We don't naïvely trust the courier |

Each scenario is the **same components reacting to different inputs**. Build the engine once; scenarios are just event sequences fed into it.

### 4.2 The demo clock (essential)

Inspection windows and no-ship timers are measured in days. Nobody waits 7 days in a meeting. Build a **fast-forward clock**: a control that advances simulated time so the audience watches the inspection window count down and auto-release fire in seconds. This single control is what makes the timer-based scenarios (2 and 5) demonstrable.

---

## 5. The Screens

Nine surfaces. Build them in the order given in §7, not the order listed here.

### 5.1 Landing page

The first frame investors see — build it well. Calm, trust-forward palette (lean into *sukoon* = peace of mind).

- Hero: **"Buyer protection & instant merchant settlement for Pakistan."** + the two differentiators
- A "How it works" row: pay → held in escrow → delivered → released (four icons)
- A Sharia badge: **"Halal by design · Wakala + Amanah"**
- Login / Sign up buttons

### 5.2 Login / Signup (hollow — screens only)

- Signup with a **role toggle: "I'm a Buyer" / "I'm a Seller"** (the one meaningful choice)
- Login screen + mock 2FA (accepts `000000`)
- **No real auth.** Any email/password works; login just sets `currentUser` and routes to the right view
- Add **"Demo as Buyer / Seller / Admin" quick-launch buttons** — so nobody types credentials during a live pitch

### 5.3 Bazaar.pk storefront (the on-ramp — thin)

- **One product page only** — fake store name/logo, one product (e.g. PKR 4,999 shoes), image, price, size selector
- A checkout showing **two payment options side by side: Cash on Delivery vs "Pay with Sukoon Pay (Protected)"** — this choice plants the whole thesis
- A small "Buyer Protection · money held until you confirm delivery" badge under the Sukoon Pay option
- **Visually distinct from Sukoon Pay** (different colors/logo) so the audience sees the integration boundary — "we bolt onto any store"
- The "Pay" button must create a **real order in the state store** and start the escrow flow (not a static mockup)

### 5.4 Sukoon Pay checkout

- Consumer ID entry + mock 2FA screen
- Order summary showing amount + the transparent **fee breakdown** (Wakala fee, verification fee) — Sharia transparency, visible
- On confirm → money moves to escrow; buyer is dropped into the Buyer view

### 5.5 Buyer view

- Order tracker: Paid → Shipped → Out for delivery → Delivered → **Inspection: N days left** → Released
- **[Confirm receipt]** and **[Report a problem]** buttons (active during the inspection window)
- "Report a problem" opens a dispute form with reason + photo upload (mock)
- A reassuring status line: "Your money is held safely by Sukoon Pay until you confirm."

### 5.6 Seller dashboard (make this the most polished screen)

This carries the merchant pitch. Money story front and center.

- Orders list with escrow status per order
- **Two headline balances: "In Escrow (pending)" vs "Released (withdrawable)"**
- A banner: "Paid on delivery — not in 30 days."
- Per order: **[Mark shipped]** + attach tracking (mock)
- A "Withdraw to bank" button (mock)

### 5.7 Courier panel (the mock control surface)

Styled like a courier ops screen. This is where the presenter drives the engine.

- A shipment with a **status dropdown**: Picked up → In transit → Out for delivery → Delivered
- On "Delivered", a **proof upload**: photo / signature / OTP, plus a "GPS match" toggle (to demo scenario 6)
- Each change pushes an update that the buyer, seller, and escrow console react to live

### 5.8 Admin / Escrow console (makes escrow visible)

The "we are the escrow provider" screen.

- **Total held in trust**, and a list of per-order escrow accounts
- The live **state machine** for a selected order (visual, current state highlighted)
- The **double-entry ledger** for an order, with DR/CR entries animating on each event
- A **dispute queue** with Release / Refund buttons — showing the **four-eyes (two-approver)** requirement before money moves

### 5.9 Sharia & fee panel

- A one-screen "Sharia Compliance" explainer: the Wakala + Amanah structure, what we avoid (riba, gharar), and the "buyer protection is not insurance" point
- A live fee breakdown on a sample transaction, labelled as *Wakala (agency) fee* and *Amanah (trust)*
- This is a slide investors will ask about — have it built, not improvised

### 5.10 Persistent controls (always visible)

- **Scenario switcher** — pick 1 of the 6 storylines
- **Role switcher** — jump between Buyer / Seller / Courier / Admin instantly (so all sides of one transaction can be shown in seconds)
- **Fast-forward clock** — advance simulated time
- A "Reset demo" button

---

## 6. The Sharia Requirements the UI Must Show

Sharia is the only compliance that matters for this MVP, and it must be **visible on screen**, not merely claimed. Build these in:

| Requirement | Where it appears in the UI |
|---|---|
| Transparent, fixed, capped service fee | Checkout fee breakdown + Sharia panel — labelled *Wakala fee*, never a vague % |
| Funds "held in trust", never "invested" | Buyer view status line + escrow console wording (*Amanah*) |
| Deterministic dispute rules (no "sole discretion") | Dispute flow shows the rule being applied + published outcome |
| Dispute fee as a service charge, not a penalty | Labelled "adjudication service fee" wherever shown |
| The "not insurance" point | One line in the Sharia panel: "We return your own money from trust — no premium, no pool, no risk transfer." |

---

## 7. Build Order

Build the invisible engine first; polish the screens after. This order minimizes rework — e.g. the storefront's "Pay" button must feed the engine, so the engine exists before the storefront.

| Step | Build | Why here |
|---|---|---|
| 1 | State store + escrow state machine + the 6 scenarios + demo clock | The core. Get scenarios driving state correctly before anything looks good |
| 2 | Courier mock panel | The trigger surface — lets you exercise the engine |
| 3 | Landing page | The frame / front door |
| 4 | Login/signup (hollow) + role toggle + demo quick-launch | The illusion of a real product |
| 5 | Bazaar.pk product page + checkout (COD vs Sukoon Pay) | The on-ramp; must feed the engine, so built after it |
| 6 | Buyer view + Seller dashboard | The two differentiators live here |
| 7 | Admin / escrow console + ledger animation | Makes escrow visible |
| 8 | Sharia panel + fee breakdowns | The compliance story |
| 9 | Polish, transitions, reset, deploy | Final finish |

### Effort estimate

A polished version is roughly **2–3 weeks for one strong frontend developer**: about 1 week on the state/scenario engine (the hard part), 1–2 weeks on the nine surfaces and panels. The engine is the difficult 20%; screens go fast once it exists.

---

## 8. Definition of Done

The MVP is done when a presenter can, in a live meeting, do all of the following without touching code:

- [ ] Open the landing page, log in as a buyer with one click
- [ ] Buy the Bazaar.pk product with "Pay with Sukoon Pay", entering a Consumer ID + mock 2FA
- [ ] Switch to the seller dashboard and see the order sitting **"In Escrow — pending"**
- [ ] Switch to the courier panel and walk the parcel to "Delivered" with proof
- [ ] Watch the buyer's inspection window open; fast-forward the clock; watch it **auto-release**
- [ ] Re-run as scenario 3 (Not received) and show the **dispute → refund** path with four-eyes approval
- [ ] Open the escrow console and show the **double-entry ledger** animating and the total held in trust
- [ ] Open the Sharia panel and explain Wakala + Amanah + the fee breakdown

> **If all eight can be demonstrated fluidly, the MVP has done its job:** it shows buyer protection, instant settlement, the escrow mechanism made visible, and Sharia compliance — the four things the whole product stands on.

---

## 9. Two Things to Confirm Before Building

1. **Auto-release trigger** — confirmed with the client: courier proof of delivery **starts an inspection window**, it does not release funds directly. (This resolves a self-contradiction in the original brief and matches how Alipay and Escrow.com actually work.)
2. **Audience** — the MVP is built **interactive and clickable** (per client direction), so stakeholders can drive it themselves via the courier panel and buyer buttons, not just watch a cinematic auto-play.

---

*This specifies a demonstration prototype only. It intentionally excludes production security, real integrations, and scalability. See Document 1 for the business logic, Sharia structure, and revenue model that this prototype illustrates.*
