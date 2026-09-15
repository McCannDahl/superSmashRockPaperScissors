# Rock Paper Scissors Boom 💥

A fast-paced, minimalist browser-based multiplayer platform fighting game inspired by *Super Smash Bros.*, centered around an authoritative **Rock / Paper / Scissors clash resolution engine** and percentage-based knockback physics.

---

## 🎮 The Core Concept

1. **Move, Jump, and Battle:** Control geometric fighters across floating platforms in a 2D arena.
2. **Rock / Paper / Scissors Attacks:** Attack with **Rock (Z / J)**, **Paper (X / K)**, or **Scissors (C / L)**.
3. **Clash Engine:** When two attacks meet simultaneously:
   - ✊ **Rock** crushes ✌ **Scissors**
   - ✌ **Scissors** cuts ✋ **Paper**
   - ✋ **Paper** covers ✊ **Rock**
   - **Ties:** Both players recoil backward with 0 damage.
4. **Damage & Knockback:** The higher your accumulated damage %, the farther attacks launch you!
5. **Blast Zones & 3 Lives:** Knock opponents off the arena perimeter to eliminate them. Last fighter standing wins!

---

## ⚡ Quick Start

### 1. Local Development
```bash
# Install workspace dependencies
npm install

# Build all packages (shared, client, server)
npm run build

# Run unit and integration tests
npm test

# Start the game server
npm run start
```
Open **`http://localhost:3000`** in your browser to play!

### 2. Live Development Mode (Hot Reload)
```bash
npm run dev
```
* Client Vite dev server: `http://localhost:5173`
* Server WebSocket backend: `ws://localhost:3000`

### 3. Docker Deployment (Home-PC Production)
```bash
docker compose up -d --build
```
Verify health:
```bash
curl http://localhost:3000/health
```

---

## 🏗️ Architecture & Project Structure

```
superSmashRockPaperScissors/
├── packages/
│   ├── shared/         # Platform-agnostic game constants, types, RPS clash engine, arena geometry, math
│   ├── server/         # Node.js authoritative game server, WebSocket room manager, rate-limiter, physics loop
│   └── client/         # Vite + TypeScript web client, Canvas 2D renderer, Web Audio synthesizer, UI/HUD
├── docs/
│   ├── DEPLOYMENT.md   # Home-PC hosting, Caddy / Nginx reverse proxy, Cloudflare Tunnels, SSL
│   ├── AWS_MIGRATION.md# Future AWS migration (ECS Fargate + ALB + S3/CloudFront) and unit economics
│   ├── MONETIZATION.md # Ethical cosmetic monetization, ad abstraction, battle pass analysis
│   └── ANALYTICS.md    # Privacy-first telemetry, event schemas, and KPIs
├── docker-compose.yml  # One-command containerized production stack
├── Dockerfile          # Multi-stage production container build
├── ARCHITECTURE.md     # In-depth architectural specification
├── ROADMAP.md          # Multi-phase engineering roadmap
└── PROJECT_STATUS.md   # Live project status and milestone tracking
```

---

## 🎯 Keyboard Controls

| Action | Primary Key | Secondary Key |
| :--- | :--- | :--- |
| **Move Left / Right** | `A` / `D` | `←` / `→` |
| **Jump** | `W` / `Space` | `↑` |
| **Rock Attack ✊** | `Z` | `J` |
| **Paper Attack ✋** | `X` | `K` |
| **Scissors Attack ✌** | `C` | `L` |

---

## 🧪 Automated Testing

```bash
npm test
```
Runs 22+ automated tests verifying:
- 100% of Rock/Paper/Scissors clash combinations and ties
- Damage percentage accumulation and knockback launch scaling
- AABB and one-way platform physics collision resolution
- Blast zone boundary detection and life loss
- Server room lifecycle, rate limiting, and state broadcast synchronization
- HTTP `/health` and telemetry ingestion endpoints

---

## 📄 License
MIT
