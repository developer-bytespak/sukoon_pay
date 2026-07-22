# Sukoon Pay — Demo MVP

**سکون — peace of mind** · Escrow-based buyer protection & instant merchant settlement for Pakistan's e-commerce.

This is the **demonstration MVP** specified in `Sukoon-Pay-2-MVP-Build-Spec.md`: a fully client-side, clickable prototype. A single Zustand store acts as the simulated backend — real escrow arithmetic, double-entry ledger, fake money. No server, no real auth, no real payments.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

Deploy: static host (Vercel/Netlify). `vercel.json` includes the SPA rewrite — `vercel deploy` just works, or drag `dist/` into Netlify.

## Driving the demo

The dark **demo controls bar** (bottom of every screen) is the presenter's cockpit:

- **Scenario** — seeds one of the 6 storylines (happy path, silent buyer, not received, defective, never ships, suspicious proof). A hint banner tells you which buttons to press.
- **View as** — jump instantly between Buyer / Seller / Courier / Admin.
- **Fast-forward clock** (+12h/+1d/+3d/+7d) — makes the 7-day inspection window and 3-day no-ship timer fire in seconds.
- **Reset demo** — wipes everything (state persists across refreshes via localStorage otherwise).

Full walkthrough from scratch: Landing → *Try the demo store* → Bazaar.pk → **Pay with Sukoon Pay** → 2FA code `000000` → confirm. Then Seller: *Mark shipped* → Courier: walk to *Delivered* with proof → Buyer: confirm (or fast-forward) → Admin: watch the ledger.

## Verification scripts

- `npx tsx scripts/smoke.ts` — engine unit checks (all 6 scenarios, four-eyes gate, ledger balance)
- `node scripts/verify.mjs` — headless browser walkthrough of the spec's Definition-of-Done checklist (needs the dev server running; uses system Edge/Chrome)

## Structure

- `src/engine/` — the simulated backend: state machine transitions, tiered Wakala fees, double-entry ledger, demo clock, scenario seeds, Zustand store
- `src/pages/` — Landing (with the Sharia section at `/#sharia`), split-screen Auth for login/signup, Bazaar.pk storefront, Sukoon checkout, Buyer view, Seller dashboard, Courier ops panel, Admin/Escrow console
- `src/components/` — demo controls bar, state-machine diagram, animated ledger table, timeline, fee breakdown
