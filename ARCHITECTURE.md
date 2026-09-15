# Rock Paper Scissors Boom — Architecture Specification

## 1. Executive Summary

**Rock Paper Scissors Boom** (RPS Boom) is a high-tempo, minimalist, browser-based multiplayer fighting game inspired by platform fighters like *Super Smash Bros.* The central combat innovation is an authoritative **Rock / Paper / Scissors clash resolution engine** combined with percentage-based damage knockback mechanics.

The game is engineered for:
1. **Instant Accessibility:** Zero download, instant browser play, sub-30-second learning curve.
2. **Deterministic Authoritative Server:** Zero client-trust for physics, collisions, attack resolutions, knockback, lives, and match outcomes.
3. **Extreme Low-Cost Infrastructure:** Runs on a home PC via a single `docker compose up` command; cleanly migrates to AWS (ECS/Fargate + ALB + S3/CloudFront) with zero game-loop rewrites.
4. **Game Feel First:** Minimalist geometric visual aesthetic paired with procedural Web Audio synthesis, screen shake, hit-stop, and dynamic particle systems.
5. **Clean Monetization & Analytics:** Ethical cosmetic and ad abstraction layers designed into the architecture from day one.

---

## 2. System Architecture Overview

The repository is structured as a TypeScript monorepo with three core workspaces:

```
superSmashRockPaperScissors/
├── packages/
│   ├── shared/         # Platform-agnostic game constants, types, RPS clash engine, arena geometry, math
│   ├── server/         # Node.js authoritative game server, WebSocket room manager, rate-limiter, physics loop
│   └── client/         # Vite + TypeScript web client, Canvas 2D renderer, Web Audio synthesizer, UI/HUD
├── docs/               # In-depth architectural guides (Deployment, AWS Migration, Monetization, Analytics)
├── docker-compose.yml  # One-command containerized stack for local development and home-PC hosting
├── Dockerfile          # Multi-stage production container build (shared -> client -> server)
├── ARCHITECTURE.md     # This document
├── ROADMAP.md          # Multi-phase engineering roadmap
└── PROJECT_STATUS.md   # Live project health, milestones, known issues, and technical debt
```

### Component Interaction Diagram

```
+-------------------------------------------------------------------------+
|                              Web Browser                                |
|  +-------------------+   +----------------------+   +----------------+  |
|  |  HTML5 / CSS Menu |   | Canvas 2D Renderer   |   | Web Audio Synth|  |
|  |  - Landing Page   |   | - 60 FPS loop        |   | - Procedural   |  |
|  |  - Room Browser   |   | - Interpolation      |   |   retro sound  |  |
|  |  - HUD / Stats    |   | - Hitstop & Shake    |   |   effects      |  |
|  +---------+---------+   +----------+-----------+   +--------+-------+  |
|            |                        |                        |          |
|            +-------------------+----+------------------------+          |
|                                |                                        |
|                     [Client Network Manager]                            |
+--------------------------------+----------------------------------------+
                                 | WebSocket (JSON/Binary Frames)
                                 v
+-------------------------------------------------------------------------+
|                     Authoritative Game Server (Node.js)                 |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | Input Validation & Rate Limiting (Flood Guard, Token Bucket)      |  |
|  +---------------------------------+---------------------------------+  |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | Room & Matchmaking Manager                                        |  |
|  | - Public Matchmaking Queue (2-4 players)                           |  |
|  | - Private Room Codes (e.g. "BOOM42")                              |  |
|  | - Lifecycle: Lobby -> Countdown -> Active -> RoundEnd -> MatchEnd  |  |
|  +---------------------------------+---------------------------------+  |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | Fixed-Timestep Physics & Simulation Engine (30/60 Hz)             |  |
|  | - Velocity & Gravity Integration                                  |  |
|  | - Platform AABB Collision Resolution                              |  |
|  | - Blast Zone Elimination Detection                                |  |
|  +---------------------------------+---------------------------------+  |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | Authoritative Rock/Paper/Scissors Clash Engine                    |  |
|  | - Timing window correlation                                       |  |
|  | - Range validation                                                |  |
|  | - Matrix: Rock > Scissors > Paper > Rock (Ties produce recoil)    |  |
|  | - Damage percentage scaling -> Knockback Impulse calculation      |  |
|  +---------------------------------+---------------------------------+  |
|                                    v                                    |
|  +-------------------------------------------------------------------+  |
|  | State Delta Serializer & Broadcast Pipeline (30 Hz Tick)          |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | HTTP Endpoints: /health, /api/status, /api/analytics              |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 3. Technology Choices and Rationale

| Layer | Chosen Technology | Rationale |
| :--- | :--- | :--- |
| **Language** | **TypeScript 5.x** (Strict Mode) | Full type-safety shared across client and server. Eliminates serialization drift bugs. |
| **Monorepo** | **npm workspaces** | Native to Node.js, zero third-party orchestrator overhead (no complex Turborepo or Nx setup needed for lean deployments). |
| **Frontend Framework** | **Vite + Vanilla TS / Canvas 2D** | Sub-millisecond HMR, zero bundle bloat (<150KB gzip total client bundle). Custom high-performance 2D Canvas renderer tailored for geometry, crisp blast lines, particle trails, and responsive letterboxed canvas. |
| **Backend Runtime** | **Node.js 22+ / 24+ LTS** | Universal JavaScript runtime, high I/O throughput for WebSockets, instant startup, low memory footprint (~40MB RAM per server instance). |
| **Networking** | **`ws` (Native WebSockets)** | Ultra-fast, battle-tested, low-overhead WebSocket implementation with direct socket control and minimal packet latency. |
| **Audio Engine** | **Web Audio API Procedural Synthesizer** | 100% code-generated 8-bit/arcade sound effects (noise bursts, frequency sweeps, square waves). 0 bytes asset download, 0 network latency, 0 copyright risk. |
| **Testing** | **Vitest** | Blazing fast ESM-native test runner, Jest-compatible API, immediate test iteration for core physics and RPS clash engines. |
| **Deployment** | **Docker Multi-Stage Build + Compose** | Single unified image that builds the client, bundles the server, and serves both HTTP and WebSockets on a single port for seamless Home-PC hosting and ECS portability. |

---

## 4. Multiplayer and Networking Model

### 4.1 Client-Server Contract

The client is strictly an **input collector** and **state interpolator**:
* The client sends **input snapshots** (`moveX`, `jump`, `attack: 'rock' | 'paper' | 'scissors' | null`, `timestamp`, `seq`).
* The client **never** broadcasts its position, its health, whether it hit an opponent, or whether it won a clash.
* The server simulates the world at a deterministic **30 Hz tick rate** (with sub-stepped physics at 60 Hz).
* Every tick, the server sends a compressed **WorldStateSnapshot**:
  - Match phase (`lobby`, `countdown`, `active`, `round_over`, `match_over`)
  - Player states (id, x, y, vx, vy, isGrounded, facing, damagePercent, lives, attackState, isInvulnerable, isEliminated)
  - Active combat events (clashes, hits, blast zone KOs)

### 4.2 Smooth Interpolation & Client Reconciliation

* The client maintains a rolling buffer of server snapshots (~100ms buffer).
* Remote entities are smoothly interpolated using linear Hermite/Lerp interpolation between the two most recent snapshots.
* Local player movement employs client-side prediction for instant responsiveness, with server-authoritative soft reconciliation when server coordinates deviate beyond an error threshold (>12px).
* When a clash or high-knockback explosion occurs, server state overrides local velocity instantly, triggering local hit-stop freeze frames (50–100ms) and camera shake.

---

## 5. Game State and Simulation Model

### 5.1 Arena Geometry & Blast Zones

The canonical arena (Arena 1: "The Core Platform") consists of:
* **Main Stage:** Centered solid platform (width: 800px, height: 40px) at Y = 460.
* **Left Floating Platform:** Semisolid / one-way platform (width: 220px, height: 16px) at X = 200, Y = 320.
* **Right Floating Platform:** Semisolid / one-way platform (width: 220px, height: 16px) at X = 780, Y = 320.
* **Top Floating Platform:** Semisolid platform (width: 260px, height: 16px) at X = 470, Y = 200.
* **Blast Zones:**
  - Left: `X < -250`
  - Right: `X > 1450`
  - Top: `Y < -300`
  - Bottom: `Y > 850`

### 5.2 Accumulated Damage and Knockback Scaling

Knockback velocity magnitude $V_{kb}$ is calculated strictly on the server:

$$V_{kb} = V_{base} + \left(\frac{Damage\%}{100}\right) \times KnockbackFactor \times AttackMultiplier$$

* At **0% damage**: Knockback is light; players recover within platform reach.
* At **50% damage**: Knockback pushes players to the arena edge, requiring prompt recovery jumping.
* At **100%+ damage**: High probability of hitting blast zones unless DI (directional influence) or recovery jump is executed.
* At **150%+ damage**: Almost any clean clash win sends the loser into the blast zone with explosive force.

### 5.3 Rock/Paper/Scissors Clash Engine

When two players trigger attacks within an active timing window ($\Delta t \le 180\text{ ms}$) and distance ($dist \le 120\text{ px}$):

1. **Resolution Matrix:**
   * **Rock vs Scissors:** Rock wins. Scissors takes damage (+18%) & heavy horizontal knockback.
   * **Scissors vs Paper:** Scissors wins. Paper takes damage (+15%) & diagonal upward knockback.
   * **Paper vs Rock:** Paper wins. Rock takes damage (+14%) & steep vertical knockback.
   * **Identical Attack (e.g. Rock vs Rock):** **TIE / CLASH.**
     - Both players take 0 damage.
     - Both players experience equal horizontal recoil repulsion (rebound velocity $\pm 350\text{ px/s}$).
     - Visual clash ring effect and metallic clang sound generated.
2. **Uncontested Hits:**
   * If Player A attacks Player B while Player B is not attacking or is outside their startup window: Player A lands a direct uncontested hit. Player B takes base attack damage (+10-14%) and knockback.

---

## 6. Deployment Architecture

### 6.1 Phase 1: Home-PC Self-Hosting

* **Stack:** Single Docker container running Node.js 22 LTS with built client assets served statically alongside WebSocket server.
* **Port:** `3000` (HTTP + WS).
* **Reverse Proxy:** Optional Caddy or Nginx container for automated Let's Encrypt HTTPS / WSS.
* **Resource footprint:** <150MB RAM, <5% CPU on idle, capable of hosting 50+ concurrent rooms on consumer hardware.

### 6.2 Phase 2: AWS Cloud Migration

When player volume requires horizontal scaling:
1. **Frontend:** Static Vite build deployed to **AWS S3** and distributed worldwide via **CloudFront CDN** (sub-20ms asset delivery, 0 server load).
2. **Game Server:** Containerized backend deployed to **AWS ECS (Fargate)** behind an **Application Load Balancer (ALB)** with WebSocket sticky sessions or a lightweight Redis Pub/Sub room router.
3. **DNS & Security:** **Route 53** with AWS ACM SSL certificates and AWS WAF rate-limiting.
4. **Data & Telemetry:** CloudWatch for server health metrics; DynamoDB or lightweight PostgreSQL (RDS) for optional user profiles and cosmetic inventories.

---

## 7. Monetization Architecture

The monetization system is strictly **cosmetic and convenience-oriented**; zero pay-to-win mechanics are permitted.

1. **Ad Abstraction Service (`IAdProvider`):**
   * Pluggable provider interface (`NullAdProvider`, `GenericBannerAdProvider`, `AdSenseProvider`).
   * Ads appear exclusively in the main menu, room lobby, and post-match screens. No ads during live combat.
2. **Cosmetic Registry:**
   * Player geometric themes (Neon, Cyber, Monochrome, Gold, Retro Arcade).
   * Clash particle effects (Fireworks, Shockwaves, Confetti, Pixel Shatter).
   * Victory fanfare chimes and custom player titles.
3. **Optional "Pro Pass / Supporter":**
   * One-time micro-purchase to remove all banner ads, unlock exclusive glowing trail cosmetics, and host custom private room mutators (e.g. Low Gravity, Sudden Death, 1-Life).

---

## 8. Analytics & Telemetry Architecture

A lightweight, privacy-first event telemetry system:
* Ingestion endpoint: `POST /api/analytics/events`
* Events tracked:
  - `session_start`, `match_created`, `match_joined`, `match_completed`, `clash_resolved`, `player_eliminated`, `rematch_requested`
* **Zero PII:** No cookies, no IP tracking, anonymous UUID session tokens only.
* Metrics computed: Match completion rate, average session duration, RPS attack distribution, clash win rates, D1/D7 retention cohorts.
