# Rock Paper Scissors Boom — Engineering Roadmap

This roadmap defines the structured, iterative engineering path from zero to a publicly playable, scalable, monetizable browser fighting game.

---

## Phase 1: Core Engine & Single-Player Prototype (Current Phase)
- [x] Monorepo setup with npm workspaces (`packages/shared`, `packages/server`, `packages/client`).
- [x] Shared game types, vector math, AABB collision, blast zones, and RPS clash resolution rules.
- [x] Full unit test coverage for Rock/Paper/Scissors clash matrix (100% test combinations, ties, edge cases).
- [x] Canvas 2D client prototype with responsive letterbox rendering, platform display, and local physics simulation.
- [x] Basic movement: Run, jump, gravity, air control, platform collision, and blast zone fall-off.
- [x] Input mapping: WASD / Arrow Keys for movement, Z / X / C (or J / K / L) for Rock / Paper / Scissors attacks.
- [x] In-engine procedural sound synthesizer (Web Audio API) for instant zero-latency feedback.

---

## Phase 2: Authoritative Multiplayer Networking
- [x] Node.js WebSocket game server (`packages/server`) using `ws`.
- [x] Deterministic fixed-step server game loop (30Hz broadcast, 60Hz physics).
- [x] Client-server network protocol: input snapshots -> server simulation -> world state broadcasts.
- [x] Real-time two-player synchronization with client-side interpolation and remote entity smoothing.
- [x] Authoritative hit detection and RPS clash resolution on the server.
- [x] Dynamic damage percentage accumulation and knockback scaling.
- [x] Blast zone player elimination, life decrement, and respawn with temporary invulnerability.

---

## Phase 3: Complete MVP Match Experience
- [x] Match lifecycle state machine: `Lobby` -> `Countdown (3-2-1-FIGHT)` -> `Active Combat` -> `Round / Match Over`.
- [x] 3-Lives system with visual heart/stock indicators.
- [x] Room management: Public matchmaking queue + Private room codes (e.g. `BOOM42`) with 1-click shareable links.
- [x] Player identity: guest username generator, color selection, and avatar silhouette.
- [x] In-game HUD: Player names, damage percentages (white -> fiery red gradient), lives, attack indicators.
- [x] Post-match victory screen: Winner announcement, match combat statistics, Rematch button, and Return to Menu.

---

## Phase 4: Juicy Game Feel & Visual Polish
- [x] Dynamic camera shake on heavy attacks, clash collisions, and blast-zone knockouts.
- [x] Impact freeze-frames (hit-stop) on clash resolutions to heighten dramatic tension.
- [x] Particle system: jump dust, attack arcs (Rock fist, Paper sheets, Scissor sparks), clash rings, explosion bursts.
- [x] Procedural sound design: 8-bit jump sound, swing whoosh, heavy stone slam, sharp snip, metallic clash, death explosion.
- [x] Clear visual icons and overhead callout tags for ROCK, PAPER, SCISSORS during attacks.

---

## Phase 5: Production Readiness & Home-PC Hosting
- [x] Single-command Docker Compose stack (`docker compose up`) packaging static client and server together.
- [x] Input validation, rate limiting, and packet flood protection against malicious clients.
- [x] HTTP health check endpoint (`/health`) and real-time server metrics (`/api/status`).
- [x] Detailed Home-PC deployment guide with reverse proxy (Caddy/Nginx), SSL, and port forwarding instructions.
- [x] Interactive Onboarding & "How to Play" tutorial overlay directly in the web client.

---

## Phase 6: Monetization & Analytics Architecture
- [x] Pluggable Ad Provider abstraction layer (`IAdProvider`) for safe menu/lobby banners without gameplay disruption.
- [x] Cosmetic item architecture (custom skins, trail colors, custom victory fanfare).
- [x] Privacy-first event telemetry system (`/api/analytics/events`) tracking DAU, matches played, clash win rates, and retention.
- [x] Comprehensive Monetization Strategy & Infrastructure Economics documentation (`docs/MONETIZATION.md`).

---

## Phase 7: AWS Cloud Migration Strategy
- [x] Architecture specification for future migration from Home-PC to AWS ECS/Fargate + ALB + S3/CloudFront.
- [x] Scalability and unit economics modeling (Cost per active match, bandwidth projections, breakeven analysis).
- [x] Documented in `docs/AWS_MIGRATION.md`.
