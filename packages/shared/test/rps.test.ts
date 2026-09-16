import { describe, it, expect } from 'vitest';
import {
  determineRpsWinner,
  resolveClash,
  calculateKnockback,
  checkAABBOverlap,
  isPlayerInBlastZone,
  resolvePlatformCollision,
  DEFAULT_ARENA,
  PlayerState,
  AttackType,
} from '../src/index.js';

function createMockPlayer(id: string, x: number, y: number, damagePercent: number = 0): PlayerState {
  return {
    id,
    name: `Player_${id}`,
    color: '#00ffff',
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    isGrounded: true,
    damagePercent,
    lives: 3,
    isEliminated: false,
    isInvulnerable: false,
    invulnerabilityTimer: 0,
    attackState: null,
    hitstunTimer: 0,
    ready: true,
    isHost: id === 'p1',
    stats: {
      damageDealt: 0,
      kos: 0,
      clashesWon: 0,
      clashesLost: 0,
      clashesTied: 0,
    },
  };
}

describe('Rock Paper Scissors Clash Matrix', () => {
  it('ROCK vs SCISSORS -> ROCK wins', () => {
    expect(determineRpsWinner('rock', 'scissors')).toBe('winner_a');
  });

  it('SCISSORS vs PAPER -> SCISSORS wins', () => {
    expect(determineRpsWinner('scissors', 'paper')).toBe('winner_a');
  });

  it('PAPER vs ROCK -> PAPER wins', () => {
    expect(determineRpsWinner('paper', 'rock')).toBe('winner_a');
  });

  it('SCISSORS vs ROCK -> ROCK wins (winner_b)', () => {
    expect(determineRpsWinner('scissors', 'rock')).toBe('winner_b');
  });

  it('PAPER vs SCISSORS -> SCISSORS wins (winner_b)', () => {
    expect(determineRpsWinner('paper', 'scissors')).toBe('winner_b');
  });

  it('ROCK vs PAPER -> PAPER wins (winner_b)', () => {
    expect(determineRpsWinner('rock', 'paper')).toBe('winner_b');
  });

  it('ROCK vs ROCK -> TIE', () => {
    expect(determineRpsWinner('rock', 'rock')).toBe('tie');
  });

  it('PAPER vs PAPER -> TIE', () => {
    expect(determineRpsWinner('paper', 'paper')).toBe('tie');
  });

  it('SCISSORS vs SCISSORS -> TIE', () => {
    expect(determineRpsWinner('scissors', 'scissors')).toBe('tie');
  });
});

describe('Clash Resolution Details', () => {
  it('resolves clash where Player A wins with Rock over Scissors', () => {
    const p1 = createMockPlayer('p1', 400, 500, 20);
    const p2 = createMockPlayer('p2', 450, 500, 40);

    const result = resolveClash(p1, 'rock', p2, 'scissors');

    expect(result.outcome).toBe('winner_a');
    expect(result.winnerId).toBe('p1');
    expect(result.loserId).toBe('p2');
    expect(result.damageDealt).toBeGreaterThan(0);
    // Winner takes zero knockback
    expect(result.knockbackA).toEqual({ x: 0, y: 0 });
    // Loser receives positive launch away from attacker
    expect(result.knockbackB.x).toBeGreaterThan(0);
    expect(result.knockbackB.y).toBeLessThan(0); // Upward launch
  });

  it('resolves clash where Player B wins with Paper over Rock', () => {
    const p1 = createMockPlayer('p1', 400, 500, 0);
    const p2 = createMockPlayer('p2', 450, 500, 0);

    const result = resolveClash(p1, 'rock', p2, 'paper');

    expect(result.outcome).toBe('winner_b');
    expect(result.winnerId).toBe('p2');
    expect(result.loserId).toBe('p1');
    expect(result.knockbackB).toEqual({ x: 0, y: 0 });
    // p1 pushed left
    expect(result.knockbackA.x).toBeLessThan(0);
  });

  it('resolves tie: both players take 0 damage and experience opposing recoil', () => {
    const p1 = createMockPlayer('p1', 400, 500, 50);
    const p2 = createMockPlayer('p2', 450, 500, 50);

    const result = resolveClash(p1, 'rock', p2, 'rock');

    expect(result.outcome).toBe('tie');
    expect(result.winnerId).toBeNull();
    expect(result.loserId).toBeNull();
    expect(result.damageDealt).toBe(0);
    // p1 on left pushed left, p2 on right pushed right
    expect(result.knockbackA.x).toBeLessThan(0);
    expect(result.knockbackB.x).toBeGreaterThan(0);
  });
});

describe('Damage and Knockback Scaling', () => {
  it('scales knockback higher when defender has higher damage percentage', () => {
    const attacker = createMockPlayer('atk', 400, 500);
    const defenderLow = createMockPlayer('defLow', 450, 500, 10);
    const defenderHigh = createMockPlayer('defHigh', 450, 500, 120);

    const kbLow = calculateKnockback(attacker, defenderLow, 'rock');
    const kbHigh = calculateKnockback(attacker, defenderHigh, 'rock');

    const magLow = Math.hypot(kbLow.x, kbLow.y);
    const magHigh = Math.hypot(kbHigh.x, kbHigh.y);

    expect(magHigh).toBeGreaterThan(magLow * 1.8);
  });
});

describe('Collision & Blast Zones', () => {
  it('detects when player is inside blast zones', () => {
    const insidePlayer = createMockPlayer('p1', 500, 400);
    expect(isPlayerInBlastZone(insidePlayer, DEFAULT_ARENA.blastZones)).toBe(false);

    const fallenPlayer = createMockPlayer('p2', 500, 950);
    expect(isPlayerInBlastZone(fallenPlayer, DEFAULT_ARENA.blastZones)).toBe(true);

    const sideLaunchedPlayer = createMockPlayer('p3', 1500, 400);
    expect(isPlayerInBlastZone(sideLaunchedPlayer, DEFAULT_ARENA.blastZones)).toBe(true);
  });

  it('resolves platform landing correctly', () => {
    const platform = DEFAULT_ARENA.platforms[0]; // Main ground at y = 520
    const player = createMockPlayer('p1', 500, 525);
    player.vy = 200;

    const landed = resolvePlatformCollision(player, platform, 515);

    expect(landed).toBe(true);
    expect(player.y).toBe(platform.y);
    expect(player.vy).toBe(0);
    expect(player.isGrounded).toBe(true);
  });
});
