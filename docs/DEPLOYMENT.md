# Home-PC Hosting & Deployment Guide

This guide covers running **Rock Paper Scissors Boom** on your home PC or private server with low overhead and exposing it securely to the public internet.

---

## 1. Local Quick Start (Development)

### Prerequisites
* **Node.js**: v20+ or v22+ LTS installed.
* **npm**: v10+ installed.

### Setup and Running
```bash
# Clone or navigate to the repository
cd superSmashRockPaperScissors

# Install all workspace dependencies
npm install

# Build shared library and client
npm run build

# Start the game server (serves web app + WebSockets on port 3000)
npm run start
```

Visit `http://localhost:3000` in your web browser. Open multiple tabs or invite a friend on your local network to test multiplayer combat!

---

## 2. One-Command Containerized Deployment (Docker)

The project includes a multi-stage `Dockerfile` and `docker-compose.yml` that builds the shared library, compiles the web client, and runs the Node.js server in a slim, secure Alpine container.

### Run with Docker Compose
```bash
docker compose up -d --build
```

### Verify Status
```bash
docker compose ps
curl http://localhost:3000/health
```

### View Logs
```bash
docker compose logs -f rps-boom
```

### Restart or Update
```bash
git pull
docker compose up -d --build
```

---

## 3. Exposing to the Internet (Home-PC Production)

To let friends or public players join your home-hosted server, you need:
1. A Domain Name or Free Dynamic DNS (e.g., DuckDNS, Cloudflare, No-IP).
2. Port Forwarding on your home router.
3. Automated HTTPS / SSL (using Caddy or Nginx).

### Recommended Architecture: Caddy Reverse Proxy

Caddy automatically provisions and renews free Let's Encrypt SSL certificates with zero manual certbot commands.

#### Step 1: Router Port Forwarding
In your home router's admin panel:
* Forward external port `80` (TCP) -> Home PC internal IP port `80`
* Forward external port `443` (TCP) -> Home PC internal IP port `443`

#### Step 2: Caddyfile Configuration
Create a `Caddyfile` on your home server:

```caddy
rpsboom.yourdomain.com {
    # Reverse proxy both HTTP and WebSocket traffic to the game container
    reverse_proxy localhost:3000
    
    # Enable gzip / zstd compression
    encode gzip zstd
    
    # Security headers
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy no-referrer-when-downgrade
    }
}
```

#### Step 3: Start Caddy
```bash
caddy run --config Caddyfile
```

Now players can navigate to `https://rpsboom.yourdomain.com` securely with WSS (secure WebSockets) automatically supported!

---

## 4. Alternative: Cloudflare Tunnels (Zero Router Port Forwarding)

If your ISP uses CGNAT or you do not wish to open router ports:
1. Install `cloudflared` on your PC.
2. Run `cloudflared tunnel create rps-boom`.
3. Route your Cloudflare DNS subdomain to `http://localhost:3000`.
4. Cloudflare automatically provides global CDN edge caching, SSL, and DDoS mitigation without exposing your home IP.

---

## 5. Maintenance, Backups & Health Monitoring

### Server Health Checks
The server exposes an automated health endpoint:
* `GET /health` -> `{"status":"ok","uptime":1245,"rooms":4,"players":10}`
* `GET /api/status` -> Detailed server diagnostics and memory statistics.

### Automated Restarts
In `docker-compose.yml`, `restart: unless-stopped` ensures that if your PC reboots or the process encounters an unexpected crash, Docker automatically revives the game server within seconds.
