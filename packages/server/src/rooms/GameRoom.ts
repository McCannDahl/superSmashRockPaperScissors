import { WebSocket } from 'ws';
import {
  ArenaConfig,
  AttackType,
  AttackState,
  ClashCombatEvent,
  CombatEvent,
  DEFAULT_ARENA,
  GAME_CONSTANTS,
  HitCombatEvent,
  MatchPhase,
  PlayerInput,
  PlayerState,
  RoomState,
  ServerMessage,
  Vector2D,
  calculateKnockback,
  isPlayerInBlastZone,
  resolveClash,
  resolvePlatformCollision,
  ATTACK_CONFIGS,
} from '@rps-boom/shared';
import { RateLimiter } from '../security/RateLimiter.js';
import { analytics } from '../analytics/AnalyticsService.js';

export interface ConnectedPlayer {
  id: string;
  ws: WebSocket;
  state: PlayerState;
  rateLimiter: RateLimiter;
  pendingInput: PlayerInput | null;
  rematchRequested: boolean;
}

export class GameRoom {
  public readonly id: string;
  public readonly code: string;
  public readonly isPrivate: boolean;
  public readonly createdAt: number;
  private arena: ArenaConfig;
  private phase: MatchPhase = 'lobby';
  private countdownTimer: number = 0;
  private winnerId: string | null = null;
  private tick: number = 0;
  private players: Map<string, ConnectedPlayer> = new Map();
  private pendingEvents: CombatEvent[] = [];
  private loopInterval: NodeJS.Timeout | null = null;
  private lastTickTime: number = Date.now();

  constructor(id: string, code: string, isPrivate: boolean = false) {
    this.id = id;
    this.code = code;
    this.isPrivate = isPrivate;
    this.createdAt = Date.now();
    this.arena = DEFAULT_ARENA;

    this.startSimulationLoop();
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public isEmpty(): boolean {
    return this.players.size === 0;
  }

  public getPhase(): MatchPhase {
    return this.phase;
  }

  public addPlayer(id: string, name: string, color: string, ws: WebSocket): PlayerState {
    const isFirst = this.players.size === 0;
    const spawnIdx = this.players.size % this.arena.spawnPoints.length;
    const spawn = this.arena.spawnPoints[spawnIdx];

    const playerState: PlayerState = {
      id,
      name,
      color,
      x: spawn.x,
      y: spawn.y,
      vx: 0,
      vy: 0,
      facing: spawn.x < this.arena.width / 2 ? 1 : -1,
      isGrounded: true,
      damagePercent: 0,
      lives: GAME_CONSTANTS.INITIAL_LIVES,
      isEliminated: false,
      isInvulnerable: false,
      invulnerabilityTimer: 0,
      attackState: null,
      hitstunTimer: 0,
      ready: false,
      isHost: isFirst,
      stats: {
        damageDealt: 0,
        kos: 0,
        clashesWon: 0,
        clashesLost: 0,
        clashesTied: 0,
      },
    };

    const connectedPlayer: ConnectedPlayer = {
      id,
      ws,
      state: playerState,
      rateLimiter: new RateLimiter(60, 40),
      pendingInput: null,
      rematchRequested: false,
    };

    this.players.set(id, connectedPlayer);

    analytics.trackEvent('player_joined_room', { roomId: this.id, playerId: id });

    return playerState;
  }

  public removePlayer(id: string): void {
    const player = this.players.get(id);
    if (!player) return;

    this.players.delete(id);
    analytics.trackEvent('player_left_room', { roomId: this.id, playerId: id });

    // Reassign host if host left
    if (player.state.isHost && this.players.size > 0) {
      const nextHost = this.players.values().next().value;
      if (nextHost) {
        nextHost.state.isHost = true;
      }
    }

    // If game was playing and only 1 player remains, end match
    if (this.phase === 'playing' || this.phase === 'countdown') {
      this.checkRemainingPlayers();
    }
  }

  public setPlayerReady(id: string, ready: boolean): void {
    const player = this.players.get(id);
    if (!player) return;

    player.state.ready = ready;

    // In lobby, check if all players are ready
    if (this.phase === 'lobby' && this.players.size >= 2) {
      const allReady = Array.from(this.players.values()).every((p) => p.state.ready);
      if (allReady) {
        this.startCountdown();
      }
    }
  }

  public handlePlayerInput(id: string, input: PlayerInput): void {
    const player = this.players.get(id);
    if (!player) return;

    if (!player.rateLimiter.allowRequest(1)) {
      return; // Rate limit exceeded
    }

    player.pendingInput = input;
  }

  public handleRematchRequest(id: string): void {
    const player = this.players.get(id);
    if (!player || this.phase !== 'match_over') return;

    player.rematchRequested = true;

    // Check if all remaining connected players want a rematch
    const allRematch = Array.from(this.players.values()).every((p) => p.rematchRequested);
    if (allRematch && this.players.size >= 2) {
      this.startCountdown();
    }
  }

  public getRoomState(): RoomState {
    const playersObj: Record<string, PlayerState> = {};
    for (const [id, p] of this.players.entries()) {
      playersObj[id] = { ...p.state };
    }

    return {
      id: this.id,
      code: this.code,
      isPrivate: this.isPrivate,
      phase: this.phase,
      countdownTimer: this.countdownTimer,
      winnerId: this.winnerId,
      players: playersObj,
      arena: this.arena,
      tick: this.tick,
    };
  }

  private startCountdown(): void {
    this.phase = 'countdown';
    this.countdownTimer = GAME_CONSTANTS.COUNTDOWN_DURATION_SEC;
    this.winnerId = null;

    let idx = 0;
    for (const p of this.players.values()) {
      const spawn = this.arena.spawnPoints[idx % this.arena.spawnPoints.length];
      p.state.x = spawn.x;
      p.state.y = spawn.y;
      p.state.vx = 0;
      p.state.vy = 0;
      p.state.facing = spawn.x < this.arena.width / 2 ? 1 : -1;
      p.state.damagePercent = 0;
      p.state.lives = GAME_CONSTANTS.INITIAL_LIVES;
      p.state.isEliminated = false;
      p.state.isInvulnerable = false;
      p.state.invulnerabilityTimer = 0;
      p.state.attackState = null;
      p.state.hitstunTimer = 0;
      p.rematchRequested = false;
      idx++;
    }

    analytics.trackEvent('match_started', { roomId: this.id, playersCount: this.players.size });
  }

  private startSimulationLoop(): void {
    this.loopInterval = setInterval(() => {
      this.simulationTick();
    }, GAME_CONSTANTS.TICK_INTERVAL_MS);
  }

  private simulationTick(): void {
    const now = Date.now();
    const dt = Math.min((now - this.lastTickTime) / 1000, 0.1);
    this.lastTickTime = now;
    this.tick++;

    if (this.phase === 'countdown') {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.phase = 'playing';
        this.countdownTimer = 0;
      }
    } else if (this.phase === 'playing') {
      this.simulatePhysicsAndCombat(dt);
    }

    this.broadcastState();
  }

  private simulatePhysicsAndCombat(dt: number): void {
    const substeps = GAME_CONSTANTS.PHYSICS_SUBSTEPS;
    const subDt = dt / substeps;

    for (let step = 0; step < substeps; step++) {
      for (const p of this.players.values()) {
        if (p.state.isEliminated) continue;

        this.updatePlayerMovement(p, subDt);
        this.updatePlayerAttack(p, subDt);
        this.updatePlayerPhysics(p, subDt);
        this.checkBlastZones(p);
      }

      this.checkCombatCollisions();
    }

    this.checkRemainingPlayers();
  }

  private updatePlayerMovement(p: ConnectedPlayer, dt: number): void {
    const state = p.state;

    // Decrement hitstun
    if (state.hitstunTimer > 0) {
      state.hitstunTimer = Math.max(0, state.hitstunTimer - dt);
      return; // Cannot steer or attack while in hitstun
    }

    // Decrement invulnerability
    if (state.invulnerabilityTimer > 0) {
      state.invulnerabilityTimer = Math.max(0, state.invulnerabilityTimer - dt);
      state.isInvulnerable = state.invulnerabilityTimer > 0;
    }

    const input = p.pendingInput;
    if (!input) return;

    // Steering
    const isGrounded = state.isGrounded;
    const accel = isGrounded ? GAME_CONSTANTS.GROUND_MOVE_ACCEL : GAME_CONSTANTS.AIR_MOVE_ACCEL;
    const maxSpeed = isGrounded ? GAME_CONSTANTS.GROUND_MOVE_SPEED_MAX : GAME_CONSTANTS.AIR_MOVE_SPEED_MAX;

    if (input.moveX !== 0) {
      state.vx += input.moveX * accel * dt;
      state.vx = Math.max(-maxSpeed, Math.min(maxSpeed, state.vx));
      state.facing = input.moveX > 0 ? 1 : -1;
    } else if (isGrounded) {
      // Ground friction deceleration
      state.vx *= GAME_CONSTANTS.GROUND_FRICTION;
      if (Math.abs(state.vx) < 10) state.vx = 0;
    } else {
      // Air drag
      state.vx *= GAME_CONSTANTS.AIR_DRAG;
    }

    // Jump
    if (input.jump && isGrounded) {
      state.vy = GAME_CONSTANTS.JUMP_VELOCITY;
      state.isGrounded = false;
      input.jump = false; // Consume jump
    }

    // Attack Trigger
    if (input.attack && state.attackState === null) {
      const config = ATTACK_CONFIGS[input.attack];
      state.attackState = {
        type: input.attack,
        phase: 'startup',
        timer: config.startupSec,
        totalStartup: config.startupSec,
        totalActive: config.activeSec,
        totalRecovery: config.recoverySec,
      };
      input.attack = null; // Consume attack trigger
    }
  }

  private updatePlayerAttack(p: ConnectedPlayer, dt: number): void {
    const state = p.state;
    if (!state.attackState) return;

    const atk = state.attackState;
    atk.timer -= dt;

    if (atk.timer <= 0) {
      if (atk.phase === 'startup') {
        atk.phase = 'active';
        atk.timer = atk.totalActive;
      } else if (atk.phase === 'active') {
        atk.phase = 'recovery';
        atk.timer = atk.totalRecovery;
      } else {
        // Recovery complete
        state.attackState = null;
      }
    }
  }

  private updatePlayerPhysics(p: ConnectedPlayer, dt: number): void {
    const state = p.state;
    const prevY = state.y;

    // Apply gravity
    state.vy += GAME_CONSTANTS.GRAVITY * dt;
    state.vy = Math.min(GAME_CONSTANTS.MAX_FALL_SPEED, state.vy);

    // Apply velocities
    state.x += state.vx * dt;
    state.y += state.vy * dt;

    // Platform collisions
    state.isGrounded = false;
    for (const platform of this.arena.platforms) {
      const landed = resolvePlatformCollision(state, platform, prevY);
      if (landed) {
        break;
      }
    }
  }

  private checkBlastZones(p: ConnectedPlayer): void {
    const state = p.state;
    if (state.isEliminated) return;

    if (isPlayerInBlastZone(state, this.arena.blastZones)) {
      state.lives--;

      this.pendingEvents.push({
        type: 'elimination',
        playerId: state.id,
        livesRemaining: state.lives,
        killerId: null,
        x: state.x,
        y: state.y,
        timestamp: Date.now(),
      });

      if (state.lives > 0) {
        // Respawn
        const spawn = this.arena.spawnPoints[Math.floor(Math.random() * this.arena.spawnPoints.length)];
        state.x = spawn.x;
        state.y = spawn.y;
        state.vx = 0;
        state.vy = 0;
        state.damagePercent = 0;
        state.attackState = null;
        state.hitstunTimer = 0;
        state.isInvulnerable = true;
        state.invulnerabilityTimer = GAME_CONSTANTS.SPAWN_INVULNERABILITY_SEC;

        this.pendingEvents.push({
          type: 'respawn',
          playerId: state.id,
          x: state.x,
          y: state.y,
          timestamp: Date.now(),
        });
      } else {
        state.isEliminated = true;
        state.attackState = null;
      }
    }
  }

  private checkCombatCollisions(): void {
    const playersList = Array.from(this.players.values()).filter((p) => !p.state.isEliminated);

    for (let i = 0; i < playersList.length; i++) {
      for (let j = i + 1; j < playersList.length; j++) {
        const p1 = playersList[i];
        const p2 = playersList[j];

        if (p1.state.isInvulnerable || p2.state.isInvulnerable) {
          continue;
        }

        const dx = p1.state.x - p2.state.x;
        const dy = p1.state.y - p2.state.y;
        const dist = Math.hypot(dx, dy);

        const atk1 = p1.state.attackState;
        const atk2 = p2.state.attackState;

        // Both players active in attack -> CLASH
        if (atk1 && atk1.phase === 'active' && atk2 && atk2.phase === 'active') {
          if (dist <= GAME_CONSTANTS.CLASH_MAX_DISTANCE) {
            this.handleClash(p1, atk1.type, p2, atk2.type);
            continue;
          }
        }

        // p1 active, p2 vulnerable -> Direct Hit
        if (atk1 && atk1.phase === 'active' && (!atk2 || atk2.phase !== 'active')) {
          const config1 = ATTACK_CONFIGS[atk1.type];
          if (dist <= config1.range) {
            this.handleDirectHit(p1, atk1.type, p2);
            atk1.phase = 'recovery';
            continue;
          }
        }

        // p2 active, p1 vulnerable -> Direct Hit
        if (atk2 && atk2.phase === 'active' && (!atk1 || atk1.phase !== 'active')) {
          const config2 = ATTACK_CONFIGS[atk2.type];
          if (dist <= config2.range) {
            this.handleDirectHit(p2, atk2.type, p1);
            atk2.phase = 'recovery';
            continue;
          }
        }
      }
    }
  }

  private handleClash(p1: ConnectedPlayer, atk1: AttackType, p2: ConnectedPlayer, atk2: AttackType): void {
    const clash = resolveClash(p1.state, atk1, p2.state, atk2);

    if (clash.outcome === 'tie') {
      p1.state.vx = clash.knockbackA.x;
      p1.state.vy = clash.knockbackA.y;
      p2.state.vx = clash.knockbackB.x;
      p2.state.vy = clash.knockbackB.y;

      p1.state.stats.clashesTied++;
      p2.state.stats.clashesTied++;

      // Cancel attacks
      p1.state.attackState = null;
      p2.state.attackState = null;
    } else if (clash.outcome === 'winner_a') {
      p2.state.damagePercent += clash.damageDealt;
      p2.state.vx = clash.knockbackB.x;
      p2.state.vy = clash.knockbackB.y;
      p2.state.hitstunTimer =
        GAME_CONSTANTS.HITSTUN_BASE_SEC + p2.state.damagePercent * GAME_CONSTANTS.HITSTUN_SCALING;
      p2.state.attackState = null;

      p1.state.stats.damageDealt += clash.damageDealt;
      p1.state.stats.clashesWon++;
      p2.state.stats.clashesLost++;

      // Winner enters short recovery
      if (p1.state.attackState) {
        p1.state.attackState.phase = 'recovery';
      }
    } else {
      // winner_b
      p1.state.damagePercent += clash.damageDealt;
      p1.state.vx = clash.knockbackA.x;
      p1.state.vy = clash.knockbackA.y;
      p1.state.hitstunTimer =
        GAME_CONSTANTS.HITSTUN_BASE_SEC + p1.state.damagePercent * GAME_CONSTANTS.HITSTUN_SCALING;
      p1.state.attackState = null;

      p2.state.stats.damageDealt += clash.damageDealt;
      p2.state.stats.clashesWon++;
      p1.state.stats.clashesLost++;

      if (p2.state.attackState) {
        p2.state.attackState.phase = 'recovery';
      }
    }

    const event: ClashCombatEvent = {
      type: 'clash',
      playerAId: p1.id,
      playerBId: p2.id,
      attackA: atk1,
      attackB: atk2,
      outcome: clash.outcome,
      winnerId: clash.winnerId,
      loserId: clash.loserId,
      x: clash.clashX,
      y: clash.clashY,
      timestamp: Date.now(),
    };

    this.pendingEvents.push(event);
    analytics.trackEvent('clash_resolved', {
      attackA: atk1,
      attackB: atk2,
      outcome: clash.outcome,
    });
  }

  private handleDirectHit(attacker: ConnectedPlayer, attack: AttackType, defender: ConnectedPlayer): void {
    const config = ATTACK_CONFIGS[attack];
    const knockback = calculateKnockback(attacker.state, defender.state, attack, false);

    defender.state.damagePercent += config.damage;
    defender.state.vx = knockback.x;
    defender.state.vy = knockback.y;
    defender.state.hitstunTimer =
      GAME_CONSTANTS.HITSTUN_BASE_SEC + defender.state.damagePercent * GAME_CONSTANTS.HITSTUN_SCALING;
    defender.state.attackState = null;

    attacker.state.stats.damageDealt += config.damage;

    const event: HitCombatEvent = {
      type: 'hit',
      attackerId: attacker.id,
      victimId: defender.id,
      attack,
      damage: config.damage,
      x: defender.state.x,
      y: defender.state.y - GAME_CONSTANTS.PLAYER_HEIGHT / 2,
      knockback,
      timestamp: Date.now(),
    };

    this.pendingEvents.push(event);
  }

  private checkRemainingPlayers(): void {
    const active = Array.from(this.players.values()).filter((p) => !p.state.isEliminated);

    if (active.length <= 1 && this.players.size >= 2) {
      this.phase = 'match_over';
      this.winnerId = active.length === 1 ? active[0].id : null;

      if (this.winnerId) {
        const winner = this.players.get(this.winnerId);
        if (winner) {
          winner.state.stats.kos++;
        }
      }

      this.pendingEvents.push({
        type: 'match_end',
        winnerId: this.winnerId,
        timestamp: Date.now(),
      });

      analytics.trackEvent('match_completed', {
        roomId: this.id,
        winnerId: this.winnerId,
      });
    }
  }

  private broadcastState(): void {
    const playersObj: Record<string, PlayerState> = {};
    for (const [id, p] of this.players.entries()) {
      playersObj[id] = { ...p.state };
    }

    const payload: ServerMessage = {
      type: 'state_update',
      payload: {
        tick: this.tick,
        phase: this.phase,
        countdownTimer: Math.max(0, this.countdownTimer),
        winnerId: this.winnerId,
        players: playersObj,
        events: [...this.pendingEvents],
      },
    };

    const serialized = JSON.stringify(payload);
    for (const p of this.players.values()) {
      if (p.ws.readyState === WebSocket.OPEN) {
        p.ws.send(serialized);
      }
    }

    // Clear events after dispatch
    this.pendingEvents = [];
  }

  public destroy(): void {
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }
}
