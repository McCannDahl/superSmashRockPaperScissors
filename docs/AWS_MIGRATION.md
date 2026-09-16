# AWS Migration Strategy & Infrastructure Economics

This document specifies the migration path from a single-machine Home PC deployment to an elastic, highly available AWS architecture when player volume, latency, or bandwidth requirements demand scale.

---

## 1. When to Migrate to AWS

Do **not** migrate to AWS prematurely. Keep operating costs near $0 on a Home PC until:
1. **Concurrent Connections:** Home internet bandwidth saturates (e.g. >100 simultaneous matches / >400 concurrent WebSockets).
2. **Geographic Latency:** International players require regional game servers (e.g., US-East, US-West, EU-Central) to keep ping under 60ms.
3. **High Availability:** Home ISP power/internet outages cause unacceptable player dropouts.
4. **Revenue Proof:** Gross monthly revenue consistently exceeds the projected ~$40–$80/month AWS baseline infrastructure cost.

---

## 2. Target AWS Architecture

```
                   [ Internet Players ]
                            │
               Route 53 DNS (Latency Routing)
                            │
            ┌───────────────┴───────────────┐
            │                               │
       Static Assets                  Game WebSockets
            │                               │
     AWS CloudFront CDN            AWS Application Load Balancer (ALB)
            │                         (Sticky Sessions / WSS)
       AWS S3 Bucket                        │
    (Vite SPA HTML/JS/CSS)       ┌──────────┴──────────┐
                                 │                     │
                           ECS Fargate Task      ECS Fargate Task
                           (Game Server 1)       (Game Server 2)
                                 │                     │
                                 └──────────┬──────────┘
                                            │
                                  ElastiCache Redis
                             (Matchmaking & Room Router)
                                            │
                                   Amazon DynamoDB
                               (Persistent Player Stats)
```

### Component Breakdown
1. **Frontend Hosting (S3 + CloudFront):**
   * Static assets (`index.html`, JavaScript bundles, Web Audio scripts) are compiled and synced to an S3 bucket (`s3 sync dist/ s3://rpsboom-assets/`).
   * CloudFront distributes assets globally across 400+ Edge locations with HTTP/3, TLS 1.3, and automatic Brotli compression.
   * **Cost:** ~$0.50–$2.00 / month. Zero CPU load on the backend.
2. **Game Server (AWS ECS on AWS Fargate):**
   * Container image pushed to Amazon ECR.
   * Runs the exact same Docker container built for Home PC.
   * Configured with 0.5 vCPU and 1 GB RAM per task (~$15/month per running task).
   * Auto-scales horizontally based on active WebSocket connection metrics.
3. **Networking (Application Load Balancer):**
   * Manages SSL termination and routes `/health` and `/api/*` to active containers.
   * WebSocket connections persist to the instance hosting that specific Room Code.
4. **Matchmaking & Room Routing (ElastiCache Redis / Valkey):**
   * When scaling across multiple ECS tasks, Redis stores the mapping of `room_code -> ecs_task_ip`.
   * Cross-instance matchmaking queue for public matchmaking.

---

## 3. Infrastructure Economics & Unit Costs

### Estimated Monthly Cost at 1,000 DAU (Daily Active Users)
| Service | Specification | Monthly Cost (USD) |
| :--- | :--- | :--- |
| **AWS S3 + CloudFront** | 100 GB transfer (tiny client bundle) | $1.50 |
| **AWS Fargate (Backend)** | 1x task (0.5 vCPU, 1GB RAM) 24/7 | $15.20 |
| **AWS ALB** | 1 ALB with 10 LCU | $22.00 |
| **Route 53** | 1 Hosted Zone + queries | $0.60 |
| **Data Transfer Out** | ~50 GB WebSocket state diffs | $4.50 |
| **Total Baseline Cost** | | **~$43.80 / month** |

### Breakeven Analysis
* Cost per active match: **<$0.002**
* At an estimated Average Revenue Per Active User (ARPAU) of **$0.08** (via modest non-intrusive banner ads + 2% cosmetic purchase conversion):
  - 1,000 DAU generates **~$80.00 / month**.
  - **Net Gross Contribution:** $80.00 - $43.80 = **+$36.20 / month profit**.
* Scaling to 10,000 DAU:
  - Infrastructure scales to ~$140 / month.
  - Revenue scales to ~$800 / month.
  - **Net Gross Contribution:** **+$660.00 / month profit**.

---

## 4. Step-by-Step Migration Checklist

1. **Step 1: Container Registry Push**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
   docker tag rps-boom:latest $ECR_URL/rps-boom:latest
   docker push $ECR_URL/rps-boom:latest
   ```
2. **Step 2: Deploy ECS Task Definition**
   * Configure environment variables: `PORT=3000`, `NODE_ENV=production`, `PUBLIC_WS_URL=wss://api.rpsboom.com`.
3. **Step 3: Setup ALB Target Group**
   * Protocol: HTTP/1.1 with WebSocket upgrade support.
   * Health check path: `/health`, interval 15s.
4. **Step 4: Deploy S3/CloudFront Distribution**
   * Build client with `VITE_SERVER_URL=wss://api.rpsboom.com`.
5. **Step 5: Cutover DNS in Route 53**
   * Point apex domain to CloudFront distribution.
   * Point `api.rpsboom.com` to Application Load Balancer.
