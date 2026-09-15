# Monetization Strategy & Business Model Analysis

## 1. Core Monetization Philosophy

**Rule #1: NEVER RUIN THE GAME TO MAKE MONEY.**
* **Zero Pay-to-Win:** Spending money will never increase damage, reduce knockback, increase movement speed, or give gameplay advantages.
* **Instant Free Access:** A player must be able to visit the site, hit "Play", and compete at 100% full competitive parity with zero friction.
* **Respect Player Time:** No mid-match ad interruptions. No unskippable 30-second popups during combat.

---

## 2. Business Model Evaluation Matrix

| Monetization Model | Dev Effort | Infra Cost | Revenue Potential | User Friendliness | Retention Risk | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Menu/Lobby Banner Ads** | Very Low | $0 | Low–Medium ($0.50–$2 CPM) | High (Non-intrusive) | Negligible | **Deploy in Phase 5** |
| **"Remove Ads" ($2.99 One-time)** | Very Low | $0 | Medium | Very High | Negative (Increases loyalty) | **Deploy in Phase 6** |
| **Cosmetic Skins & Trails** | Low–Medium | Very Low | High | Very High | Very Low | **Deploy in Phase 6** |
| **Supporter Pass ($4.99)** | Medium | Low | High | High | Low | **Deploy Post-Launch** |
| **Battle Pass / Seasons** | High | Medium | Very High | Medium | Medium (If grindy) | **Defer until 5k+ MAU** |
| **Pay-to-Win Stats** | Low | $0 | Short-term spike | Horrible | Catastrophic | **STRICTLY PROHIBITED** |

---

## 3. Detailed Monetization Streams

### 3.1 Non-Intrusive Display & Banner Advertising
* **Placements:**
  - Bottom banner on the Main Menu screen.
  - Sidebar banner in the Room Lobby while waiting for players.
  - Compact summary banner on the Post-Match Victory / Rematch screen.
* **Implementation Pattern:**
  - Built behind an abstraction layer (`IAdProvider`) in `client/src/ads/AdManager.ts`.
  - Supports `NullAdProvider` (for ad-free subscribers or local dev), `GenericBannerAdProvider` (HTML5 ad slots), and enterprise ad networks (AdSense / Playwire).
  - Can be toggled on/off via server configuration.

### 3.2 Purely Cosmetic Customization
Cosmetic customization leverages the minimalist geometric aesthetic:
1. **Fighter Geometric Skins:**
   - Default: Vibrant Cyan / Orange / Magenta / Lime Neon Squares.
   - Unlockable/Purchasable Skins: Cyber Grid, Gold Foil, Holographic Prismatic, Carbon Fiber, 8-Bit Pixel.
2. **Attack Clash Effects:**
   - Custom Rock crunch particles (rubble vs explosive sparks).
   - Custom Scissors slash arcs (laser trails, lightning bolts).
   - Custom Paper wrap animations (origami crane burst, scroll unfurl).
3. **Victory Celebrations & Emotes:**
   - Victory crown, fireworks burst, retro victory melody.
   - Quick pre-match geometric emotes (thumbs up, laughing rock, waving paper).

### 3.3 "RPS Boom Supporter" One-Time Purchase ($3.99 – $4.99)
A friction-free one-time micro-transaction:
* Permanently disables all banner and lobby ads.
* Unlocks the exclusive "Golden Crown" fighter avatar & rainbow launch trail.
* Grants ability to enable fun custom Room Mutators in private matches:
  - *Low Gravity Mode* (Moon bounce)
  - *Sudden Death* (All players start at 200% damage)
  - *One-Life Survival*
  - *Rock Only / Scissors Only / Paper Only*

---

## 4. Virtual Currency & Battle Pass Assessment

### Why We Reject Virtual Currencies for MVP
* Adding "Boom Bucks" or gems requires complex accounting, legal compliance with digital currency regulations, wallet balances, refund handling, and server persistence.
* Direct micro-payments via Stripe or LemonSqueezy for specific bundles or supporter passes are cleaner, more transparent, and build higher player trust.

### Battle Pass Conditions
* Battle passes require consistent seasonal content creation (new assets every 60 days) and high daily active user counts to maintain progression vitality.
* We will evaluate a seasonal cosmetic pass only once the game sustains >5,000 Monthly Active Users (MAU) and >35% D1 retention.
