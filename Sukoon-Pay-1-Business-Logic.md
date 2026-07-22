# Sukoon Pay — Business Logic & How It Works

**سکون — peace of mind**

*Escrow-based buyer protection & instant merchant settlement for Pakistan's e-commerce*

**Document 1 of 2** · Version 1.0 · Confidential — for internal, investor & stakeholder use

---

## 1. What Sukoon Pay Is — In One Paragraph

Sukoon Pay is an **escrow-based payment layer for Pakistani e-commerce**. When a buyer pays for an online order, the money is not sent to the seller — it is held safely by Sukoon Pay. The seller ships the product; a partner courier delivers it and provides proof of delivery. Once delivery is confirmed and the buyer is satisfied (or an inspection window passes without complaint), Sukoon Pay releases the payment to the seller — instantly. If the product never arrives, or arrives defective, the buyer's money is refunded. Sukoon Pay holds the funds in trust as an agent of both parties, and charges a transparent, fixed service fee for doing so. The entire structure is built to comply with Islamic finance principles.

> **The one-line pitch:** Sukoon Pay is Alipay's escrow model — the mechanism that solved buyer-seller trust in China and let Taobao beat eBay — rebuilt **Sharia-first** for Pakistan's cash-dominated, COD-broken e-commerce market. Pakistan today resembles China in 2004: low trust, cash-heavy, and held back by exactly the buyer-seller trust gap escrow was invented to close.

---

## 2. The Two Problems We Solve

Sukoon Pay exists because Pakistani e-commerce is trapped by a lack of trust between buyers and sellers. That single problem shows up as two separate pains — one for each side of every transaction.

### Problem A — The buyer's fear (why they insist on Cash on Delivery)

Pakistani buyers overwhelmingly refuse to pay online in advance. Over 80% of orders are Cash on Delivery. The reason is simple: they don't trust that the product will arrive, or that it will be what was advertised. COD is their protection mechanism — "I'll pay when I can see it in my hand." But COD creates enormous downstream problems (below), and it still doesn't protect them from receiving a defective product, since they've often paid before inspecting.

**Sukoon Pay's answer:** the buyer pays upfront, but their money is **held safely, not handed over**. If the product doesn't arrive or is defective, they get refunded. They get COD's protection *without* the cash — and better, because escrow also covers "arrived but defective."

### Problem B — The seller's cash-flow trap (why COD is killing them)

When an e-commerce store uses COD, the courier collects the cash from the customer on delivery — and then **holds that money for days or weeks** before settling it to the store. A store doing meaningful volume always has millions of rupees locked up with couriers. On top of that, 30–45% of COD orders in Pakistan come back undelivered (Return-to-Origin), and the seller pays shipping both ways on every one.

**Sukoon Pay's answer:** the moment delivery is proven, the seller is paid — **the same day**, not weeks later. And because the buyer has already paid into escrow, orders are effectively prepaid, which collapses the fake-order and RTO problem.

> **The two differentiators, stated plainly:**
> 1. **Buyer protection through escrow** — money held safely until delivery is confirmed; instant refund if it fails.
> 2. **Faster settlement for merchants** — paid on proof of delivery, same day, instead of waiting weeks for courier COD settlement.

---

## 3. The Actors

| Actor | Role | Relationship to Sukoon Pay |
|---|---|---|
| **Buyer** | Places and pays for an order; confirms receipt or raises a dispute | Holds a Sukoon Pay identity (Consumer ID); Sukoon Pay is their agent (*wakeel*) |
| **Seller / Merchant** | Runs an e-commerce store; ships the product; receives payment on proven delivery | Has "Sukoon Pay" attached as a payment method on their store; Sukoon Pay is their agent |
| **Courier** | Third-party delivery (TCS, Leopards, M&P, etc.); provides tracking & proof of delivery | **Partner, not owned.** Sukoon Pay ingests their status updates and proof |
| **Sukoon Pay** | Holds funds in trust; verifies delivery; releases or refunds; adjudicates disputes | **The neutral escrow provider** — agent of both buyer and seller, owner of neither's money |

> ⚠️ **On couriers:** Sukoon Pay does **not** provide delivery. Couriers remain independent third-party partners. (A long-term future option is to handle logistics in-house, but that is explicitly out of scope for now.) For today, Sukoon Pay's role is to *consume* courier tracking and proof-of-delivery and act on it.

---

## 4. How It Works — The Core Flow

A single successful transaction, end to end:

```
  1. CHECKOUT        Buyer shops on the seller's store, chooses "Pay with Sukoon Pay"
                     instead of Cash on Delivery.

  2. PAY (secure)    Buyer authenticates with their Consumer ID + 2FA — no card
                     numbers re-entered. Money moves into ESCROW.

  3. HELD IN TRUST   ┌────────────────────────────────────────────┐
                     │  Money sits with Sukoon Pay (Amanah).      │
                     │  NOT the seller's yet. NOT spendable.      │
                     │  Seller sees "In Escrow — pending".        │
                     └────────────────────────────────────────────┘

  4. SHIP            Seller marks the order shipped and hands the parcel to a
                     partner courier. A 3-day timer guards against no-ship.

  5. DELIVER         Courier delivers, updates status to "Delivered", and supplies
                     PROOF OF DELIVERY (signature / photo / OTP).

  6. INSPECTION      Proof of delivery does NOT release the money. It starts an
     WINDOW          INSPECTION WINDOW during which the buyer can:
                       • Confirm receipt  → immediate release
                       • Report a problem → dispute
                       • Do nothing       → auto-release when the window expires

  7. RELEASE         Funds released to the seller — SAME DAY.
                     Sukoon Pay's service fee is deducted transparently.

  8. WITHDRAW        Seller withdraws their balance to their bank account.
```

> ⚠️ **Critical design decision — proof of delivery starts a clock, it does not release the money.**
>
> A naïve system releases funds the instant the courier says "delivered." That reintroduces the exact fraud escrow exists to prevent: the courier marks delivered, the buyer says "I never got it," and the seller has already been paid. Instead, courier proof **opens an inspection window**. The buyer gets a real chance to object; silence becomes consent only *after* that chance. This is precisely how Alipay/Taobao and Escrow.com operate — auto-confirm on timeout, but only after the buyer had the opportunity to act. It is both the correct fraud control and the Sharia-correct approach (a published, deterministic rule instead of arbitrary discretion).

---

## 5. The Escrow State Machine

Every order is always in exactly one state. This is the heart of the product.

```
                        buyer pays
   CREATED ─────────────────────────────► HELD_IN_ESCROW
                                                │
                              seller marks shipped
                                                ▼
                                            SHIPPED ──────────────► (3-day no-ship
                                                │                    timer → AUTO_REFUND)
                              courier: delivered + proof
                                                ▼
                                       INSPECTION_WINDOW
                                                │
              ┌─────────────────────────────────┼─────────────────────────────────┐
              ▼                                 ▼                                 ▼
      buyer confirms                   window expires,                    buyer reports
      receipt                          buyer silent                       a problem
              │                                 │                                 │
              ▼                                 ▼                                 ▼
         RELEASED  ◄──────────────────────  RELEASED                          DISPUTED
        (instant)                          (auto)                                │
                                                                     admin adjudication
                                                                     (deterministic rules,
                                                                      four-eyes approval)
                                                                                │
                                                              ┌─────────────────┴────────────┐
                                                              ▼                               ▼
                                                          REFUNDED                        RELEASED
                                                        (to buyer)                       (to seller)
```

---

## 6. Every Scenario — What Happens If…

The workflow must handle the exceptional cases, not just the happy path. These are the scenarios the system is designed around.

| # | Scenario | What happens | Outcome |
|---|---|---|---|
| 1 | **Happy path** | Delivered, buyer confirms receipt | ✅ Instant release to seller |
| 2 | **Silent buyer** | Delivered with proof, buyer never responds; inspection window counts down | ✅ Auto-release to seller (seller always gets paid) |
| 3 | **Not received** | Courier says "delivered", buyer disputes claiming non-receipt → funds frozen → adjudication reviews courier proof (GPS/photo/OTP) | Refund to buyer if proof weak; release if proof strong |
| 4 | **Defective / not as described** | Buyer receives item, reports a problem with photo evidence within the inspection window → return flow | ❌ Refund to buyer (after return where applicable) |
| 5 | **Seller never ships** | Order paid but not marked shipped within 3 days | ❌ Automatic refund — no dispute needed |
| 6 | **Suspicious courier proof** | "Delivered" scanned with no GPS match or missing photo → does NOT auto-release | Flagged for manual review, held |
| 7 | **Partial delivery** | Multi-item order, only some items arrive | Partial release / partial refund |
| 8 | **Buyer & seller agree to cancel** | Either side requests cancellation before shipment, other agrees | ❌ Full refund to buyer |

### How disputes are resolved (the anti-PayPal principle)

When a buyer reports a problem, the transaction enters `DISPUTED` and the funds stay frozen in escrow — **neither party can touch them**. Resolution follows a **published, deterministic ladder**, not arbitrary discretion:

1. **Evidence exchange** — buyer submits their claim + evidence (photos); seller submits theirs; courier proof-of-delivery is on file.
2. **Rule evaluation** — a published decision table is applied. Both parties can predict the outcome in advance from the rules.
3. **Human review** — only for cases the rules don't cleanly cover; the decision comes with written reasons, and requires **two-person (four-eyes) approval** before any money moves.
4. **Outcome** — refund to buyer or release to seller. Both parties are bound by it.

> ☪️ **Why "published rules" is also a Sharia feature:** a dispute resolved "at our sole discretion" (as PayPal's terms state) contains *gharar* — unacceptable uncertainty about a material outcome. A countdown window plus a published rule ladder removes that uncertainty. **The fraud fix and the compliance requirement are the same design.**

---

## 7. Money Movement & Settlement

Because both parties transact within Sukoon Pay, the money never has to leave the system mid-transaction. Funds rest in a **segregated trust account** (held at a partner bank, separate from Sukoon Pay's own money) for the duration of the order.

| Stage | Where the money is | Who can touch it |
|---|---|---|
| After payment | Trust account, tagged to this order's escrow | ❌ Nobody |
| During inspection | Trust account, still escrowed | ❌ Nobody |
| On release | Moved to seller's Sukoon Pay balance | ✅ Seller (withdrawable) |
| On refund | Returned to buyer | ✅ Buyer |
| During dispute | Frozen in escrow | ❌ Nobody until resolved |

**Settlement speed is the headline benefit:** release is **T+0** — same day the buyer confirms (or the inspection window closes). Contrast the status quo, where couriers hold a seller's COD cash for 3–10 days or longer. Beating that is the core merchant pitch.

---

## 8. Sharia Compliance — The Foundation

Sharia compliance is not a feature bolted on; it is the contract structure the whole product is built from. The design has been checked against the specific AAOIFI Shariah Standards that the State Bank of Pakistan has formally adopted.

### 8.1 The contract structure

| Element | Islamic contract | What it means here |
|---|---|---|
| **Holding the money** | **Wadiah yad Amanah** (trust-based safekeeping) | Sukoon Pay holds the buyer's funds in trust. It does **not own** them and does **not use** them. Liable only for negligence. The buyer's money is returnable. |
| **Acting for the parties** | **Wakala** (agency) — AAOIFI Standard No. 23 | Sukoon Pay is the *wakeel* (agent) of buyer and seller, performing the service of holding, verifying, and releasing. |
| **Our compensation** | **Ujrah** (a fee for service) | A known, fixed, agreed-in-advance service fee. Standard No. 23 explicitly permits a compensated agency. |

> ☪️ **The most important compliance point — buyer protection is NOT insurance.**
>
> The obvious objection is: "isn't 'buyer protection' just haram insurance (*gharar* + *maysir*)?" **No.** Insurance is when you pay a premium into a pool and *might* receive a payout. Sukoon Pay never does this. We simply hold the buyer's **own money** in trust and return it if delivery fails. There is **no risk transfer, no premium, no pool, no wager** — just the buyer's own funds coming back. Because we hold under *yad amanah* (never taking ownership, never using the funds), the entire objection dissolves.

### 8.2 What we avoid (the guardrails)

| Prohibited practice | Why | What we do instead |
|---|---|---|
| Interest on held balances | Riba | Nothing added to held funds (also banned by EMI rules) |
| Investing escrow float in T-bills / interest deposits | Riba | Only GoP **Ijara Sukuk**, and only with proper structure (see §9) |
| Late-payment penalties kept as profit | Riba | If charged, donated to charity |
| Conventional insurance / paid "guarantee" products | Gharar + maysir | None — protection is just return of the buyer's own trust funds |
| "Sole discretion" dispute terms | Gharar | Published, deterministic dispute rules |
| Processing for haram merchants (alcohol, gambling, etc.) | Cooperation in sin | Merchant category screening |

---

## 9. How Sukoon Pay Earns — The Revenue Model

Every revenue stream below has been checked against the Sharia structure. They are listed in order of importance.

| # | Stream | What it is | Status |
|---|---|---|---|
| 1 | **Wakala (agency) fee** | The primary revenue. A tiered, **capped** service fee for holding & releasing funds as agent. Capped so it is clearly a price for service, not a return on money. | ✅ Solid — AAOIFI Std 23, SBP-adopted |
| 2 | **Delivery-verification fee** | Small flat fee (≈PKR 30/parcel) for courier integration & proof-of-delivery verification. | ✅ Solid — service fee |
| 3 | **Adjudication service fee** | Flat, published fee for the work of resolving a dispute. A **service charge, not a penalty** — allocated to the party at fault as a cost, never framed as a fine. | ✅ Solid — service fee |
| 4 | **Float income (Sukuk)** | EMI rules allow investing up to 50% of balances in government paper. For compliance this must be **GoP Ijara Sukuk**, not T-bills. Material at scale. | ⚠️ Needs SSB sign-off on exact structure\* |
| 5 | **Merchant SaaS** | Dashboard, analytics, RTO reporting on subscription — permissible as *ijara* (leasing a software service). | ✅ Solid — ijara |

### The fee schedule (illustrative, tiered & capped)

| Transaction value | Wakala fee |
|---|---|
| ≤ PKR 5,000 | PKR 25 |
| PKR 5,000 – 25,000 | PKR 75 |
| PKR 25,000 – 100,000 | PKR 200 |
| > PKR 100,000 | PKR 400 (capped) |

**The cap is deliberate.** It keeps the fee clearly a *service charge* rather than a percentage return on money — and it is a competitive weapon. On a PKR 200,000 order, a PayPal-style 2.9% would be ~PKR 5,800; Sukoon Pay charges PKR 400. Sharia compliance here is a pricing advantage, not a tax. (For reference, Alipay itself charges a flat ~0.1% on large transactions and nothing on small ones — a real precedent for low, service-based escrow pricing.)

> ⚠️ **\* Honest note on Stream 4 (float income):** funds held as strict *amanah* cannot be used by the custodian. Earning on the float therefore requires a **separate, disclosed contract** (e.g. investment-agency/Mudarabah with consent, or investing only the platform's own capital and explicitly-consented balances). This is structurally sound but must be blessed by the Shariah Supervisory Board on its exact wording before being relied upon. Streams 1–3 and 5 are solid today; Stream 4 is a "confirm with SSB" item. We deliberately under-claim it rather than overstate it.

---

## 10. Sharia Governance

AAOIFI standards are mandatory in Pakistan. Sukoon Pay's governance therefore includes: a **Shariah Supervisory Board** (qualified scholars who certify products), an internal **Shariah Compliance Officer**, periodic **Shariah audit**, a product-approval gate (no feature ships without sign-off), and a **charity/purification account** for any inadvertent non-halal income. A published fatwa serves as both compliance and customer trust-building.

---

## 11. Competitive Position — An Honest View

Sukoon Pay is **not** "the first escrow in Pakistan," and that claim should never be made — it is easily disproven and damages credibility.

| Player | What they do | How Sukoon Pay differs |
|---|---|---|
| **SafeDeal.pk** | Manual C2C escrow — users create a transaction and invite the other party; general buy/sell protection | We are an **embedded e-commerce checkout** (bolts onto existing stores), with **courier-verified automatic release** and instant merchant settlement — not a standalone marketplace |
| **PayFast / Safepay / PayPro** | Payment gateways; some Sharia-compliant via Meezan | They move money to the seller immediately. We **hold it in escrow** until delivery — a fundamentally different value proposition |
| **KalPay** | Sharia-compliant BNPL (installments) | Different product entirely (credit vs escrow) |

> **The genuine white space:** no prominent player combines **escrow + Sharia-first + courier-verified instant settlement + embedded e-commerce checkout**. That intersection is defensible and true. Position there — not on "first escrow."

---

## 12. Summary — Why This Works

- **It solves a real, expensive problem** for both sides: buyer fear and merchant cash-flow lockup.
- **The model is proven** — it is Alipay's escrow mechanism, which onboarded half a billion users by solving exactly this trust gap in a cash market.
- **It is Sharia-compliant by construction**, not retrofit — Wakala + Amanah, with regulator-adopted standard backing, and buyer protection that is provably not insurance.
- **The revenue is clean and competitive** — capped service fees that undercut card-based alternatives while staying halal.
- **It occupies genuine white space** — the Sharia-first, courier-verified, embedded-escrow intersection is unoccupied in Pakistan.

---

*This document describes business logic and product concept. It is not a Shariah fatwa or legal opinion; the structures described (especially float/Sukuk income) require sign-off from a qualified Shariah Supervisory Board and legal counsel before commercial reliance. See Document 2 for the MVP design & build specification.*
