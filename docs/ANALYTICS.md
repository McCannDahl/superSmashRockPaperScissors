# Analytics & Telemetry Architecture

## 1. Objectives

To build a sustainable business, we must understand player behavior through quantitative data:
1. Are visitors converting to active players?
2. How long do players stay in a session?
3. What percentage of players request a rematch after completing a match?
4. Are all three RPS attacks (Rock, Paper, Scissors) balanced in player selection?
5. What are our Day-1 and Day-7 retention rates?

---

## 2. Privacy-by-Design Principles

* **Zero Personally Identifiable Information (PII):** No email addresses, phone numbers, real names, or IP addresses are stored in the telemetry database.
* **Ephemeral Session IDs:** A random UUID is generated per browser session in `sessionStorage`.
* **GDPR & CCPA Compliant:** No third-party tracking cookies or cross-site behavioral profiling.
* **Low Network Overhead:** Telemetry events are batched and dispatched asynchronously via `navigator.sendBeacon` or lightweight JSON POSTs (`POST /api/analytics/events`) during natural pauses (round end, game over).

---

## 3. Event Taxonomy

| Event Name | Trigger Context | Payload Properties | Business Purpose |
| :--- | :--- | :--- | :--- |
| `session_start` | Player visits landing page | `referrer`, `viewportWidth`, `deviceType` | Traffic acquisition & landing conversion |
| `tutorial_view` | Player clicks "How to Play" | `completed` (boolean), `durationMs` | Onboarding effectiveness |
| `match_create` | Player hosts a private or public match | `roomId`, `gameMode`, `isPrivate` | Host engagement |
| `match_join` | Player joins room | `roomId`, `playerCount` | Matchmaking efficiency |
| `match_start` | Countdown reaches 0 and combat begins | `roomId`, `playerCount`, `durationMs` | Game start funnel |
| `attack_choice` | Player activates Rock, Paper, or Scissors | `attackType` ('rock' \| 'paper' \| 'scissors') | RPS balance & meta analysis |
| `clash_resolve` | Clash interaction between two players | `winnerAttack`, `loserAttack`, `isTie` | Core clash engine verification |
| `player_ko` | Player launched into blast zone | `killerAttack`, `victimDamagePercent`, `stockLeft` | Combat tuning & kill dynamics |
| `match_complete` | Match finishes and winner crowned | `winnerId`, `totalDurationSec`, `totalClashes` | Session completion & match pacing |
| `rematch_request`| Player clicks "Play Again" / Rematch | `roomId`, `roundNumber` | Replayability & viral stickiness |

---

## 4. Key Business Metrics & KPIs

```
                          [ Landing Page Visitors ]
                                      │
                         (90% Funnel) │ Click "Play Now"
                                      v
                             [ Match Started ]
                                      │
                         (82% Funnel) │ Complete Match (0% quit)
                                      v
                             [ Match Completed ]
                                      │
                         (55% Funnel) │ Click "Play Again / Rematch"
                                      v
                             [ Rematch Started ]
```

### North Star Metrics:
1. **Match Completion Rate:** Target >80% (indicates low rage-quits, fast pacing, stable connection).
2. **Rematch Velocity:** Target >50% of players play 2+ matches per session.
3. **Day-1 Retention (D1):** Target >35% returning players within 24 hours.
4. **Day-7 Retention (D7):** Target >15% returning players after one week.
5. **RPS Distribution Uniformity:** Rock, Paper, and Scissors should each hover near 33.3% pick rates across thousands of matches.
