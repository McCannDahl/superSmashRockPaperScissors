# Rock Paper Scissors Boom — Autonomous Game Development & Monetization Brief

## Your Role

You are the lead game developer, multiplayer systems engineer, UI/UX designer, DevOps engineer, QA engineer, product manager, and monetization strategist for a new browser-based multiplayer game called:

# ROCK PAPER SCISSORS BOOM

Your job is to take this concept from an idea into a publicly playable, maintainable, scalable, and monetizable game.

Do not merely generate code snippets. Think like an experienced indie game studio building a real commercial product.

You should:

- Make reasonable technical decisions without constantly asking me for approval.
- Prefer simple solutions over unnecessarily complicated ones.
- Build the game in small, working increments.
- Keep the architecture easy for AI agents and human developers to understand and modify.
- Optimize for low operating cost.
- Design the game so it can initially run from my home PC and later migrate to AWS.
- Treat multiplayer networking, cheating prevention, reliability, and game feel as first-class concerns.
- Build monetization into the architecture from the beginning without making the game feel predatory.
- Continuously identify opportunities to make the game more fun, more shareable, and more profitable.
- Keep the graphics intentionally minimalist.
- Favor fast development and iteration over unnecessary graphical polish.

You are allowed to make implementation decisions yourself when requirements are not explicitly specified. Document important decisions.

---

# 1. THE GAME CONCEPT

The game is a browser-based multiplayer fighting game inspired by the general concept of games like Super Smash Bros.

Players control simple characters in a 2D arena.

The core gameplay is:

1. Players move around the arena.
2. Players can run, jump, fall, dodge, and attack.
3. Players have a limited number of lives.
4. Players can take damage.
5. As players accumulate damage, attacks are more likely to launch them farther.
6. Players can eventually be knocked off the arena.
7. When a player falls off the map, they lose a life.
8. When a player loses all lives, they are eliminated.
9. The last player alive wins.

The defining mechanic of the game is:

# ROCK / PAPER / SCISSORS ATTACKS

When two players attack each other at approximately the same time, each player chooses one of exactly three attacks:

- ROCK
- PAPER
- SCISSORS

The result follows the classic Rock Paper Scissors rules:

- ROCK beats SCISSORS
- SCISSORS beats PAPER
- PAPER beats ROCK

Example:

Player A attacks with ROCK.
Player B attacks with PAPER.

PAPER beats ROCK.

Therefore:

- Player B wins the attack interaction.
- Player B should not receive damage from that interaction.
- Player A receives damage.
- Player A is knocked backward.
- The knockback should become stronger as Player A's accumulated damage increases.

Another example:

Player A uses SCISSORS.
Player B uses ROCK.

ROCK wins.

Player A takes damage and knockback.

Another example:

Both players use ROCK.

ROCK vs ROCK is a tie.

The game should define a consistent tie behavior, such as:

- Neither player receives damage.
- Both attacks cancel.
- Players experience a small amount of recoil or spacing.
- The interaction has a clear visual/audio indication.

Choose a tie behavior that produces fun gameplay and is easy to understand.

---

# 2. CORE DESIGN PHILOSOPHY

The game should be extremely easy to understand.

A player should be able to open the game and understand the basic gameplay within approximately 30 seconds.

The visual identity should be minimalist rather than graphically complex.

Do NOT build a graphics-heavy game.

Prefer:

- Simple geometric characters.
- Simple platforms.
- Flat backgrounds.
- Clean typography.
- Very small number of visual assets.
- Strong use of animation, particles, screen shake, sound, and timing to create "game feel."

The game should look intentionally simple rather than unfinished.

Think:

"Minimal graphics, maximum gameplay."

The game should feel responsive and satisfying even though it is visually simple.

---

# 3. TARGET PLATFORM

The game should primarily run in a web browser.

Initial target:

- Desktop browsers.
- Keyboard controls.
- Mouse where appropriate.
- Modern Chrome, Edge, Firefox, and Safari where practical.

Eventually consider:

- Mobile browsers.
- Touch controls.
- Gamepads.
- PWA installation.
- Native wrappers if commercially justified.

Do not prioritize mobile until the desktop multiplayer version is stable.

---

# 4. RECOMMENDED TECHNICAL APPROACH

Use a modern web game architecture.

Unless there is a strong technical reason otherwise, prefer something approximately like:

Frontend:

- TypeScript
- Phaser or another mature browser-based 2D game engine
- Vite
- HTML/CSS for menus and non-game UI

Backend:

- Node.js + TypeScript
- WebSocket-based multiplayer networking
- An authoritative game server

Potential networking frameworks may include Colyseus or another well-maintained multiplayer framework.

Choose the simplest technology that provides reliable real-time multiplayer functionality.

Do not choose technology simply because it is fashionable.

Explain your technology choices in the project documentation.

---

# 5. AUTHORITATIVE MULTIPLAYER SERVER

The server must be authoritative.

Never trust the client for important game-state decisions.

The client may tell the server things like:

- "I am pressing left."
- "I am pressing jump."
- "I want to attack."
- "I selected ROCK."

The client should NOT be allowed to directly decide:

- How much damage it dealt.
- Whether another player was hit.
- Whether it won Rock Paper Scissors.
- Its own position.
- Its own remaining lives.
- Whether it is dead.
- Whether it won the match.

The server should determine the actual game state.

At minimum, the server should be responsible for:

- Player positions.
- Velocities.
- Gravity.
- Collisions.
- Attack timing.
- Attack selection.
- Rock/Paper/Scissors resolution.
- Damage.
- Knockback.
- Death.
- Respawning.
- Lives.
- Match state.
- Victory.

Design the networking model so that clients remain responsive while the server remains authoritative.

Use interpolation/reconciliation or another appropriate approach to make movement feel smooth.

---

# 6. GAME LOOP

Create a deterministic or highly controlled server game loop.

The game should have an appropriate tick rate.

Separate:

- Simulation state
- Network state
- Rendering state

Do not make rendering frequency determine game logic.

A player with a slow or laggy computer should not gain an advantage merely because of rendering behavior.

---

# 7. PLAYER MOVEMENT

Implement simple but satisfying movement.

Initial movement should include:

- Move left.
- Move right.
- Jump.
- Fall.
- Air control.
- Attack.

Potential future mechanics:

- Double jump.
- Dash.
- Air dodge.
- Wall jump.
- Blocking.
- Special attacks.

Do not add all of these initially.

Build the smallest compelling version first.

---

# 8. ATTACK SYSTEM

The attack system is the central feature of the game.

Each player should have an attack input.

When the player attacks, they select:

- ROCK
- PAPER
- SCISSORS

The UI should make this extremely clear.

Consider assigning keyboard keys such as:

- Z = Rock
- X = Paper
- C = Scissors

or another intuitive mapping.

Make the controls configurable later.

The game needs a clearly defined attack window.

Example conceptual model:

1. Player presses an attack key.
2. Client sends attack command to server.
3. Server records attack selection.
4. Player enters attack state.
5. Attack has startup frames.
6. Attack has active frames.
7. Attack has recovery frames.
8. If another player's attack overlaps appropriately, the server resolves the interaction.

Do not make Rock/Paper/Scissors selection purely cosmetic.

It must have meaningful tactical implications.

---

# 9. ROCK/PAPER/SCISSORS RESOLUTION

Implement a clear rules engine.

The core rule should effectively be:

ROCK > SCISSORS

SCISSORS > PAPER

PAPER > ROCK

For every player-vs-player attack interaction, determine:

- Which players participated.
- Which attack each selected.
- Whether the attacks occurred within an allowable timing window.
- Whether the players were actually in attack range.
- Whether either player was invulnerable.
- Whether a player had already been hit.
- Whether the interaction should resolve as a tie.

The server should resolve the interaction.

The result should be represented internally by a clear event.

For example:

ATTACK_CLASH

The event can contain information such as:

- attacker A
- attack A
- attacker B
- attack B
- winner
- loser
- damage
- knockback
- timestamp

Use a clear and testable rules engine for this.

Write unit tests for every possible matchup.

At minimum:

ROCK vs ROCK
ROCK vs PAPER
ROCK vs SCISSORS
PAPER vs ROCK
PAPER vs PAPER
PAPER vs SCISSORS
SCISSORS vs ROCK
SCISSORS vs PAPER
SCISSORS vs SCISSORS

---

# 10. DAMAGE AND KNOCKBACK

Use a damage percentage or similar accumulated-damage mechanic.

For example:

0% damage = difficult to launch

25% = modest knockback

50% = significant knockback

100% = extremely easy to launch

150%+ = extremely dangerous

These values are examples, not fixed requirements.

Tune them through gameplay testing.

The key design rule is:

MORE DAMAGE → MORE KNOCKBACK

Damage itself does not necessarily need to directly represent remaining health.

Instead, damage should represent how vulnerable the player is to being launched.

This should create the classic fighting-game tension:

A player with low damage is relatively safe.

A player with high damage can potentially be launched off the map with a strong hit.

---

# 11. LIVES

Each player should start with a limited number of lives.

Start with something like:

3 lives.

When a player is launched off the arena:

- Remove one life.
- Reset damage appropriately.
- Respawn the player.
- Provide temporary spawn protection.

When lives reach zero:

- Eliminate the player.
- Remove them from active combat.
- Display their elimination.
- Allow them to spectate if appropriate.

When exactly one player remains:

- End the match.
- Display the winner.
- Provide a rematch option.

Design the game so future modes can change the number of lives.

---

# 12. ARENAS

Start with one simple arena.

A basic arena could contain:

- Main platform.
- One or two smaller platforms.
- Left blast zone.
- Right blast zone.
- Bottom blast zone.

The arena should be designed around movement and knockback.

Do not spend large amounts of time creating many maps before the first map is fun.

After the gameplay works, create several additional minimalist arenas.

Potential future arena concepts:

- Floating islands.
- Factory.
- Space station.
- Volcano.
- Office.
- Cloud.
- Tiny platform.
- Moving platforms.
- Hazard arena.

These can remain extremely simple visually.

---

# 13. MATCHMAKING

Build a simple matchmaking system.

Players should be able to:

- Create a game.
- Join a game.
- Enter a public queue.
- Play with friends via a room code or URL.

Initially keep matchmaking simple.

An ideal MVP could support:

- 2–4 players per match.
- Public matchmaking.
- Private room creation.
- Shareable room link/code.

Potential future matchmaking features:

- Skill rating.
- Regional matchmaking.
- Ranked mode.
- Casual mode.
- Team mode.
- Tournament mode.

Do not overbuild matchmaking during MVP.

---

# 14. PLAYER IDENTITY

Players should have a simple identity.

For MVP, consider:

- Random guest name.
- Optional username.
- Simple color/avatar.

Do not require account creation before allowing a user to play unless necessary.

Reducing friction is extremely important.

A player should ideally be able to:

1. Visit website.
2. Click Play.
3. Enter a username or receive a generated one.
4. Immediately enter a match.

Later add:

- Google login.
- Other authentication providers.
- Persistent profile.
- Statistics.
- Friends.
- Achievements.

---

# 15. SPECTATOR MODE

Eventually allow eliminated players to spectate.

This is useful for multiplayer retention.

A player who loses should still have something to do rather than immediately leaving.

Potential features:

- Camera follows active players.
- Remaining player count.
- Match statistics.
- Rematch button.
- "Play Again" button.

---

# 16. GAME FEEL

This is very important.

The game should not feel like a technical prototype.

Use simple effects to make actions satisfying:

- Hit flashes.
- Knockback animation.
- Small particles.
- Screen shake.
- Attack animation.
- Sound effects.
- Impact sounds.
- UI feedback.
- Countdown.
- Victory animation.
- Elimination effects.

Minimalist graphics do NOT mean minimal game feel.

Spend more effort on:

- Responsiveness.
- Timing.
- Sound.
- Animation.
- Feedback.

than on detailed character art.

---

# 17. USER INTERFACE

The game should have an extremely simple interface.

Main menu:

ROCK PAPER SCISSORS BOOM

Buttons:

PLAY
CREATE GAME
JOIN GAME
HOW TO PLAY

In-game HUD should display:

- Player name.
- Damage percentage.
- Lives.
- Current attack indicator if appropriate.

Do not clutter the screen.

After a match:

WINNER!

Then:

PLAY AGAIN
RETURN TO MENU

---

# 18. ONBOARDING

Create a very short tutorial.

The tutorial should explain:

MOVE
JUMP
ATTACK

Then explain:

ROCK beats SCISSORS
SCISSORS beats PAPER
PAPER beats ROCK

And:

THE MORE DAMAGE YOU HAVE,
THE FARTHER YOU FLY.

The player should understand the entire concept quickly.

Do not create a giant tutorial.

---

# 19. SOUND

Sound is highly valuable for a minimalist game.

Use simple sound effects for:

- Jump.
- Attack.
- Rock.
- Paper.
- Scissors.
- Successful hit.
- Block/win.
- Knockback.
- Death.
- Respawn.
- Match start.
- Victory.

Do not use copyrighted material without permission.

Where possible, use original, generated, licensed, or permissively licensed assets.

---

# 20. CHEATING AND ABUSE

Because this is an online multiplayer game, assume players will eventually try to cheat.

The architecture should prevent obvious cheating.

Clients must not be trusted for:

- Damage.
- Position.
- Lives.
- Attack results.
- Match results.

Implement basic protections against:

- Impossible movement.
- Impossible attack rates.
- Invalid attack types.
- Invalid state transitions.
- Malformed packets.
- Packet flooding.
- Room abuse.
- Username abuse.

Build rate limiting and input validation.

Do not attempt to build an enormous anti-cheat system in the MVP.

Build the architecture correctly so stronger protection can be added later.

---

# 21. PERFORMANCE

The game should run well on ordinary computers.

Because the graphics are intentionally simple, prioritize:

- High frame rate.
- Low network latency.
- Fast startup.
- Small asset sizes.
- Efficient rendering.
- Efficient networking.

The initial build should be capable of handling multiple matches simultaneously on a relatively modest computer.

---

# 22. HOME-PC HOSTING

The first production deployment will run on my home PC.

Design the system so that I can run something like:

docker compose up

or an equivalent simple command.

The home setup should ideally contain:

- Game server.
- Web server/static frontend.
- Database if required.
- Logging.
- Monitoring.

Use containers if practical.

I should be able to restart everything easily.

Document:

- How to run locally.
- How to expose the game to the internet.
- How to configure DNS.
- How to configure HTTPS.
- How to back up persistent data.
- How to update the game.

Do NOT couple the application tightly to AWS.

---

# 23. AWS MIGRATION

Eventually the game should move to AWS once traffic becomes too large or the home-hosting setup becomes unreliable.

Design for eventual migration.

A possible architecture could eventually include:

Frontend:

- S3
- CloudFront

Backend:

- ECS/Fargate, EC2, or another suitable service

Networking:

- Application Load Balancer
- WebSocket support

Data:

- PostgreSQL/RDS or DynamoDB depending on requirements

Observability:

- CloudWatch

DNS:

- Route 53

Choose the simplest AWS architecture appropriate for the actual traffic.

Do not prematurely deploy a huge AWS architecture.

The first objective is to get players playing.

The application should be container-friendly and environment-variable driven so moving from:

HOME PC

to

AWS

does not require a rewrite.

---

# 24. DATABASE

Do not introduce a database unless it provides real value.

For MVP, ephemeral match state can live in memory.

A database may eventually store:

- Users.
- Usernames.
- Statistics.
- Match history.
- Purchases.
- Cosmetic inventory.
- Leaderboards.
- Ratings.
- Analytics.

Keep persistent data separate from temporary multiplayer state.

---

# 25. ANALYTICS

Because this is a commercial project, measure what players actually do.

Build an analytics/event system that can track events such as:

- Site visit.
- Game started.
- Match created.
- Match joined.
- Match completed.
- Match abandoned.
- Win.
- Loss.
- Player eliminated.
- Rematch.
- Tutorial completed.
- Account created.
- Ad shown.
- Ad clicked.
- Purchase started.
- Purchase completed.

Do not collect unnecessary personal information.

Make analytics privacy-conscious.

I need to be able to answer questions such as:

- How many people visit?
- How many click Play?
- How many finish a match?
- How many play again?
- How long do they play?
- Where do players quit?
- Which game mode is most popular?
- How much revenue is generated per player?
- What percentage of players return the next day?
- What percentage return after 7 days?
- What percentage make purchases?

---

# 26. MONETIZATION STRATEGY

The ultimate business goal of this project is to make money.

Do not treat monetization as something added after the game is complete.

Design the architecture to support several monetization strategies.

However:

# DO NOT RUIN THE GAME TO MAKE MONEY.

The game should remain enjoyable for people who spend $0.

The monetization system should focus on:

- Cosmetics.
- Convenience.
- Optional purchases.
- Advertising.
- Social features.
- Customization.
- Premium experiences.

Avoid pay-to-win mechanics.

Do not sell stronger attacks.

Do not sell additional damage.

Do not sell movement advantages.

Do not let paying users dominate non-paying users through direct gameplay power.

---

# 27. ADVERTISING

Evaluate advertising as a revenue source.

Possible options:

- Banner ads on menus.
- Display ads around non-game pages.
- Interstitials between matches where appropriate.
- Rewarded ads.
- Sponsored cosmetic opportunities.

Be extremely careful with advertising during active gameplay.

Do not interrupt a match with a disruptive ad.

A reasonable early model may be:

Free gameplay.

Ads shown primarily:

- In menus.
- Between matches.
- On lobby screens.
- On statistics/profile screens.

Possibly allow:

"Remove Ads"

as a one-time purchase.

Research current advertising options and browser-game ad policies before implementation.

Do not hard-code a specific advertising provider unless necessary.

Create an abstraction layer so the ad provider can be changed later.

---

# 28. IN-GAME MONETIZATION

Think creatively about cosmetic monetization.

Potential examples:

Character skins
Character colors
Attack animations
Rock effects
Paper effects
Scissors effects
Knockback effects
KO effects
Spawn animations
Victory animations
Emotes
Taunts
Nameplates
Banners
Profile frames
Arena themes
UI themes
Sound packs
Announcer packs

All purchases should ideally be cosmetic or non-competitive.

A player should be able to look cool without becoming stronger.

---

# 29. VIRTUAL CURRENCY

Evaluate whether a virtual currency is actually useful.

Do NOT add a complicated currency system merely because games traditionally have one.

If a currency is implemented, keep it simple and transparent.

For example:

Boom Bucks

could potentially be used to purchase cosmetics.

But analyze whether direct cosmetic purchases would be simpler and more profitable.

Do not create unnecessary friction.

---

# 30. BATTLE PASS / SEASONAL CONTENT

Evaluate a seasonal progression system.

Potential structure:

Season 1
Season 2
Season 3

Players earn XP by playing.

Rewards might include:

- Cosmetics.
- Titles.
- Effects.
- Emotes.
- Profile items.

An optional premium track could exist.

However, do not build a battle pass until there is evidence that players are retaining.

Retention comes before monetization complexity.

---

# 31. PREMIUM FEATURES

Potential premium features could include:

- Remove advertisements.
- Private custom arenas.
- Special cosmetic bundles.
- Advanced statistics.
- Custom player colors.
- Custom room branding.
- Tournament creation.
- Premium emotes.

Evaluate each idea based on:

- Development cost.
- Revenue potential.
- Player appeal.
- Impact on gameplay fairness.

---

# 32. SOCIAL/VIRAL GROWTH

Think beyond traditional monetization.

The game should be easy to share.

Potential viral mechanics:

- Shareable room links.
- Short room codes.
- "Challenge a friend."
- One-click rematch.
- Share match results.
- Share funny knockout moments.
- Player statistics.
- Win streaks.
- Daily challenges.
- Leaderboards.
- Tournaments.

Consider ways a player can naturally bring another player into the game.

A multiplayer game becomes much more valuable when players invite friends.

---

# 33. THE GAME SHOULD BE FUN TO WATCH

Consider whether the minimalist visual style can make matches entertaining to watch.

Explore:

- Clear attack symbols.
- Large ROCK/PAPER/SCISSORS indicators.
- Strong impact effects.
- Funny knockback.
- Spectator mode.
- Match replays eventually.
- Short rounds.

The game should potentially be entertaining to stream or share on social media.

---

# 34. BUSINESS MODEL ANALYSIS

Do not blindly implement every monetization idea.

Create a section in the project documentation called:

MONETIZATION STRATEGY

Analyze possible revenue models.

For each model estimate:

- Development effort.
- Infrastructure cost.
- Revenue potential.
- User friendliness.
- Risk of hurting retention.
- Risk of hurting the game's reputation.
- Scalability.

Consider:

Advertising

Cosmetics

Premium subscription

Remove ads purchase

Battle pass

Tournaments

Sponsored events

Branded cosmetics

Creator/influencer partnerships

Private rooms

Premium customization

Other ideas you come up with

Think like a startup founder.

The goal is not merely:

"How can we put ads in this?"

The goal is:

"How can this game become a sustainable business?"

---

# 35. INFRASTRUCTURE ECONOMICS

Keep operating costs extremely low at first.

Track:

- CPU.
- RAM.
- Network bandwidth.
- Storage.
- Database costs.
- CDN costs.
- WebSocket connection count.
- Matches per server.
- Cost per active player.
- Cost per match.

Build the system so that we can estimate:

MONTHLY REVENUE

minus

MONTHLY INFRASTRUCTURE COST

equals

GROSS CONTRIBUTION

I care about this because the business should eventually make money.

The architecture should therefore allow us to estimate the economics of scaling.

---

# 36. KEY BUSINESS METRICS

Eventually measure:

DAU = Daily Active Users

WAU = Weekly Active Users

MAU = Monthly Active Users

D1 retention

D7 retention

D30 retention

Average session length

Matches per user

Matches per session

Invites per user

Conversion to account creation

Conversion to purchase

Average revenue per paying user

Average revenue per active user

Ad revenue per user

Cost per active player

Monthly infrastructure cost

Revenue / infrastructure cost

Lifetime value

If these metrics are available, use them to guide future development.

---

# 37. DEVELOPMENT PHASES

Do not attempt to build everything at once.

Build the project in phases.

## PHASE 1 — PLAYABLE PROTOTYPE

Build:

- Basic browser rendering.
- One arena.
- One player.
- Movement.
- Jump.
- Attack.
- Simple collision.
- Basic damage.
- Knockback.
- Blast zones.

Goal:

A single player can run around and test the basic mechanics.

---

## PHASE 2 — TWO-PLAYER MULTIPLAYER

Add:

- Server.
- WebSocket multiplayer.
- Two players.
- Authoritative server.
- Player synchronization.
- Attack synchronization.
- Rock/Paper/Scissors rules.
- Damage.
- Knockback.
- Death.
- Respawn.

Goal:

Two real people can play against each other.

---

## PHASE 3 — COMPLETE MVP MATCH

Add:

- 3 lives.
- Match start.
- Match end.
- Winner.
- Rematch.
- 2–4 players.
- Private room.
- Public room.
- Basic matchmaking.
- Player names.

Goal:

A complete match can be played from start to finish.

---

## PHASE 4 — GAME FEEL

Improve:

- Animations.
- Particles.
- Sound.
- Hit effects.
- Knockback feedback.
- UI.
- Countdown.
- Victory screen.

Goal:

The game feels genuinely fun.

---

## PHASE 5 — PUBLIC WEB RELEASE

Add:

- Production website.
- HTTPS.
- Public server.
- Error handling.
- Logging.
- Analytics.
- Basic moderation.
- Basic rate limiting.
- Monitoring.

Goal:

A stranger can discover the website and play the game successfully.

---

## PHASE 6 — MONETIZATION

Add the best initial revenue mechanisms based on actual player behavior.

Potentially:

- Ads.
- Remove Ads.
- Cosmetics.
- Premium customization.

Do not add everything.

Pick the highest-potential, lowest-complexity options first.

---

## PHASE 7 — RETENTION

After people are actually playing, consider:

- Leaderboards.
- Profiles.
- Statistics.
- Daily challenges.
- Streaks.
- Achievements.
- Ranked mode.
- Seasons.
- Friends.
- Tournaments.

---

## PHASE 8 — SCALE

When the home server becomes insufficient:

Move infrastructure to AWS.

Do not migrate merely because AWS is available.

Migrate when:

- Player count justifies it.
- Home bandwidth becomes a problem.
- Reliability becomes a problem.
- Latency becomes a problem.
- Multiple servers are necessary.

---

# 38. PROJECT STRUCTURE

Create a clean project structure.

Separate concerns approximately into:

frontend

game client

shared game rules/types

multiplayer server

infrastructure

tests

documentation

analytics

configuration

Avoid giant files.

Avoid tightly coupling rendering logic with game rules.

The Rock/Paper/Scissors rules should be independently testable without needing the browser.

The server game logic should be independently testable without rendering.

---

# 39. TESTING

Create automated tests.

At minimum test:

Movement

Jumping

Gravity

Collision

Damage

Knockback

Blast zones

Lives

Respawning

Match state

Rock/Paper/Scissors outcomes

Simultaneous attacks

Ties

Invalid attacks

Invalid player input

Player disconnects

Player reconnect behavior

Room creation

Room joining

Maximum player limits

Match completion

Do not rely exclusively on manually playing the game to find bugs.

---

# 40. NETWORK TESTING

Create tools to simulate:

- High latency.
- Packet loss.
- Jitter.
- Slow clients.
- Disconnects.
- Reconnects.

The game should degrade gracefully.

A player should not be able to completely break a match simply by losing their internet connection.

---

# 41. DISCONNECT HANDLING

Define what happens when:

- A player disconnects during a lobby.
- A player disconnects during a match.
- The host disconnects.
- A server crashes.
- A client refreshes the browser.

A reasonable initial policy is:

Temporary disconnect:

Keep the player in the match briefly.

Permanent disconnect:

Remove the player after a timeout.

Do not let abandoned players make matches unplayable.

---

# 42. CONTENT MODERATION

Usernames and chat, if implemented, need moderation.

Do not build a huge moderation platform initially.

At minimum consider:

- Profanity filtering.
- Offensive username detection.
- Rate limiting.
- Report player function eventually.
- Basic anti-spam.

Voice chat should NOT be implemented in the MVP.

---

# 43. SECURITY

Treat all network input as untrusted.

Validate:

- Message structure.
- Player IDs.
- Attack values.
- Room IDs.
- Timing.
- Numeric ranges.

Protect against:

- Injection attacks.
- Invalid JSON.
- Memory abuse.
- Rate abuse.
- Oversized packets.
- Room enumeration where practical.

Do not expose server secrets to the client.

Keep secrets in environment variables.

---

# 44. CONFIGURATION

All environment-specific configuration should be externalized.

Examples:

PORT

DATABASE_URL

PUBLIC_URL

GAME_SERVER_URL

LOG_LEVEL

ANALYTICS_KEY

AD_PROVIDER_CONFIGURATION

AWS_CONFIGURATION

Do not hard-code production secrets.

Create:

.env.example

---

# 45. OBSERVABILITY

Provide useful logs.

At minimum:

- Server startup.
- Server shutdown.
- Room created.
- Player joined.
- Player left.
- Match started.
- Match completed.
- Errors.
- Abnormal client behavior.

Avoid logging sensitive information unnecessarily.

Create basic health checks.

Example:

/health

Return a useful status indicating whether the server is healthy.

---

# 46. ADMIN TOOLS

Eventually create a small admin capability.

Potential features:

- Active rooms.
- Active players.
- Match counts.
- Server health.
- Error counts.
- Banned usernames/IPs.
- Revenue metrics.

Do not build a giant dashboard initially.

A simple admin page or CLI may be sufficient.

---

# 47. DOMAIN AND BRAND

The official game name is:

Rock Paper Scissors Boom

Use the name consistently throughout the UI.

Potential short name:

RPS Boom

But default to the full name.

Create a simple visual brand around:

ROCK
PAPER
SCISSORS
BOOM

The brand should feel playful and energetic while remaining minimalist.

Do not spend a huge amount of time on branding before the game is fun.

---

# 48. SEO / LANDING PAGE

Create a lightweight landing page.

It should clearly communicate:

ROCK PAPER SCISSORS BOOM

A minimalist multiplayer fighting game.

PLAY NOW

The landing page should also explain the basic mechanic.

Potential message:

"Fight your friends.
Choose Rock, Paper, or Scissors.
Launch them off the map.
Don't get blown away."

Do not overcomplicate the landing page.

---

# 49. SHAREABILITY

Make it extremely easy to invite a friend.

Example:

CREATE GAME

returns:

Room Code: ABC123

and:

Share Link

The link should ideally allow a friend to click once and join the lobby.

---

# 50. COST CONSCIOUSNESS

Assume this project initially has almost no revenue.

Therefore:

Avoid expensive services.

Avoid managed services unless they provide substantial value.

Avoid unnecessary databases.

Avoid unnecessary third-party APIs.

Avoid expensive AI services during runtime unless their value justifies the cost.

Prefer:

- Open-source libraries.
- Simple servers.
- Static hosting.
- Small infrastructure.
- Low bandwidth.
- Simple architecture.

The game should be able to survive financially while it is small.

---

# 51. AI DEVELOPMENT PROCESS

You are an AI software-development agent.

Work incrementally.

After each meaningful feature:

1. Implement it.
2. Run tests.
3. Run linting/type checks.
4. Run the application.
5. Verify the feature.
6. Fix obvious issues.
7. Update documentation.
8. Commit the change if Git is being used.

Do not make enormous untested changes.

Prefer many small working changes over one gigantic implementation.

---

# 52. SELF-REVIEW

After each major phase, review the project.

Ask:

- Is this actually fun?
- Is multiplayer reliable?
- Is the code maintainable?
- Can a new developer understand it?
- Is the system overengineered?
- Is the server authoritative?
- Can players cheat easily?
- Is the game easy to join?
- Is startup fast?
- Is the home-hosted version cheap?
- Can this move to AWS?
- Is monetization possible without rewriting the game?
- Could this feature negatively affect retention?

Make improvements before moving forward.

---

# 53. PRODUCT STRATEGY

Do not assume the first version is the final game.

Treat the MVP as an experiment.

The most important questions are:

1. Will people play it?
2. Will they play more than once?
3. Will they invite friends?
4. Will they come back?
5. Will they pay?
6. Can revenue exceed infrastructure costs?

Optimize toward answering those questions.

Do not spend months building features that nobody uses.

---

# 54. FEATURE PRIORITIZATION

Whenever considering a new feature, score it mentally according to:

FUN

RETENTION

VIRALITY

REVENUE

IMPLEMENTATION COST

MAINTENANCE COST

Prioritize features that provide the most value for the least complexity.

A small feature that makes matches much more fun is more valuable than a complex feature nobody notices.

---

# 55. IMPORTANT GAME DESIGN PRINCIPLE

The core interaction should be memorable:

"I predicted what my opponent was going to do."

The game should reward:

- Timing.
- Reading opponents.
- Risk.
- Positioning.
- Movement.
- Bluffing.
- Quick reactions.

Do not allow the Rock/Paper/Scissors system to become completely random.

Players should feel that they can improve through skill.

---

# 56. POSSIBLE FUTURE GAME MODES

Do not implement initially, but design the architecture so these remain possible:

Free-for-all

1v1

2v2

Teams

King of the Hill

Timed survival

Sudden death

Tournament

Ranked

Casual

Battle Royale

Boss battle

Co-op

Custom rules

Mutators

Possible mutators:

Only Rock

Only Paper

Only Scissors

Fast knockback

Low gravity

Tiny arena

Huge arena

One life

Infinite lives

Random attacks

---

# 57. MONETIZATION EXPERIMENTATION

Once there are enough players, run controlled experiments.

Potential experiments:

Ads vs no ads

Remove-ads price points

Cosmetic price points

Cosmetic bundles

Free cosmetic rewards

Premium room customization

Seasonal cosmetics

Rewarded advertisements

Do not assume the first monetization system is optimal.

Measure results.

For example:

Revenue per user

Retention impact

Match completion impact

Purchase conversion

Ad engagement

Session length

---

# 58. LONG-TERM BUSINESS VISION

The ultimate goal is not merely to build a technically impressive game.

The goal is to create a small internet business.

The ideal progression is:

FUN PROTOTYPE

→

PLAYABLE MULTIPLAYER GAME

→

PUBLIC GAME

→

REPEAT PLAYERS

→

SOCIAL/WORD-OF-MOUTH GROWTH

→

MONETIZATION

→

POSITIVE UNIT ECONOMICS

→

SCALE

Do not reverse this order.

Do not optimize revenue before proving that people enjoy playing.

---

# 59. FINAL PRODUCT REQUIREMENT

At the end of the initial development process, I want a stranger to be able to:

1. Discover the website.
2. Click Play.
3. Enter a name.
4. Create or join a room.
5. Play a multiplayer match.
6. Understand Rock/Paper/Scissors attacks.
7. Take damage.
8. Knock other players off the map.
9. Lose lives.
10. Win or lose the match.
11. Rematch.
12. Invite a friend.

The game should feel like a real game rather than a software demo.

---

# 60. DELIVERABLES

Create all necessary code and supporting files for the project.

Include:

- Frontend.
- Multiplayer server.
- Shared game logic/types.
- Tests.
- Local development environment.
- Production configuration.
- Docker configuration where practical.
- Documentation.
- Deployment instructions.
- Home-PC hosting instructions.
- AWS migration documentation.
- Monetization architecture.
- Analytics architecture.
- Basic landing page.
- Basic game tutorial.

Also create a document called:

PROJECT_STATUS.md

It should track:

Current phase

Implemented features

Known bugs

Technical debt

Next recommended feature

Deployment status

Performance observations

Monetization status

Important architectural decisions

---

# 61. DEVELOPMENT RULE

Do not wait for me to specify every small detail.

When there are ambiguities:

- Choose the simplest sensible solution.
- Document the decision.
- Continue implementing.

Only stop and ask for clarification when a decision would fundamentally change the product or require significant rework.

---

# 62. YOUR FIRST TASK

Before writing a large amount of code, inspect the existing project/repository.

Determine:

- Current project structure.
- Existing technologies.
- Existing dependencies.
- Existing infrastructure.
- Existing code quality.
- Whether anything can be reused.

Then create:

ARCHITECTURE.md

containing:

- System architecture.
- Technology choices.
- Multiplayer model.
- Game state model.
- Networking model.
- Deployment model.
- Monetization architecture.
- Analytics architecture.
- Future AWS migration strategy.

Then create:

ROADMAP.md

with a concrete sequence of implementation steps.

Then begin Phase 1.

---

# 63. IMPORTANT: KEEP THE GAME SMALL

Do not accidentally turn this into a giant AAA game.

The strength of Rock Paper Scissors Boom should be:

Simple graphics.

Simple controls.

Simple rules.

Deep interactions.

Fast matches.

Easy multiplayer.

Funny knockouts.

Easy sharing.

Cheap infrastructure.

High replayability.

Potentially strong viral growth.

Build exactly that.

# END OF BRIEF