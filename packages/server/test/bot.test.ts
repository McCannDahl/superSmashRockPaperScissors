import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BotPlayer } from '../src/ai/BotPlayer.js';
import { GameRoom } from '../src/rooms/GameRoom.js';
import { DEFAULT_ARENA, PlayerState } from '@rps-boom/shared';
import { WebSocket } from 'ws';

function createDummyPlayer(id: string, x: number, y: number): PlayerState {
  return {
    id,
    name: `Player_${id}`,
    color: '#00f0ff',
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1,
    isGrounded: true,
    damagePercent: 0,
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

describe('BotPlayer AI Logic', () => {
  it('steers toward opponent when spaced far apart', () => {
    const bot = new BotPlayer('bot_1', 'TestBot', '#ff0055', 'medium');
    const botState = createDummyPlayer('bot_1', 400, 520);
    const opponentState = createDummyPlayer('human', 700, 520);

    const input = bot.update(0.033, botState, { bot_1: botState, human: opponentState }, DEFAULT_ARENA);

    expect(input.moveX).toBe(1); // Steer right toward opponent at 700
  });

  it('triggers recovery jump and steers center when off-stage', () => {
    const bot = new BotPlayer('bot_1', 'TestBot', '#ff0055', 'hard');
    // Off-stage to the left (main stage starts at 300)
    const botState = createDummyPlayer('bot_1', 150, 600);
    botState.isGrounded = false;
    botState.vy = 100;
    const opponentState = createDummyPlayer('human', 600, 520);

    const input = bot.update(0.033, botState, { bot_1: botState, human: opponentState }, DEFAULT_ARENA);

    // Steers right toward center stage
    expect(input.moveX).toBe(1);
    expect(input.jump).toBe(true);
  });

  it('triggers attack when close to opponent', () => {
    const bot = new BotPlayer('bot_1', 'TestBot', '#ff0055', 'easy');
    const botState = createDummyPlayer('bot_1', 500, 520);
    const opponentState = createDummyPlayer('human', 540, 520); // 40px away, within range

    const input = bot.update(0.033, botState, { bot_1: botState, human: opponentState }, DEFAULT_ARENA);

    expect(['rock', 'paper', 'scissors']).toContain(input.attack);
  });

  it('hard bot executes counter against opponent attack in range', () => {
    const bot = new BotPlayer('bot_1', 'MasterBot', '#ff0055', 'hard');
    const botState = createDummyPlayer('bot_1', 500, 520);
    const opponentState = createDummyPlayer('human', 550, 520);
    opponentState.attackState = {
      type: 'rock',
      phase: 'startup',
      timer: 0.1,
      totalStartup: 0.16,
      totalActive: 0.14,
      totalRecovery: 0.22,
    };

    // Run multiple samples to verify winning counter tendency
    let paperCount = 0;
    const totalSamples = 50;
    for (let i = 0; i < totalSamples; i++) {
      const freshBot = new BotPlayer('bot_1', 'MasterBot', '#fff', 'hard');
      const input = freshBot.update(0.033, botState, { bot_1: botState, human: opponentState }, DEFAULT_ARENA);
      if (input.attack === 'paper') {
        paperCount++;
      }
    }

    // Hard bot counters Rock with Paper with high probability (>= 75%)
    expect(paperCount).toBeGreaterThanOrEqual(35);
  });
});

describe('GameRoom Bot Integration', () => {
  let room: GameRoom;

  beforeEach(() => {
    room = new GameRoom('test_bot_room', 'TBOT1', true);
  });

  afterEach(() => {
    room.destroy();
  });

  it('adds and removes bot players', () => {
    const botState = room.addBot('medium');
    expect(botState).toBeDefined();
    expect(botState?.isBot).toBe(true);
    expect(botState?.botDifficulty).toBe('medium');
    expect(room.getPlayerCount()).toBe(1);

    if (botState) {
      room.removeBot(botState.id);
      expect(room.getPlayerCount()).toBe(0);
    }
  });

  it('automatically triggers countdown when human joins and readies up with bot', () => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: () => {},
      close: () => {},
    } as unknown as WebSocket;

    room.addPlayer('human', 'Hero', '#00f0ff', mockWs);
    room.addBot('easy');

    expect(room.getPlayerCount()).toBe(2);
    expect(room.getPhase()).toBe('lobby');

    // Human readies up -> all ready -> starts countdown
    room.setPlayerReady('human', true);
    expect(room.getPhase()).toBe('countdown');
  });

  it('simulates combat ticks between human and bot seamlessly', async () => {
    const mockWs = {
      readyState: WebSocket.OPEN,
      send: () => {},
      close: () => {},
    } as unknown as WebSocket;

    room.addPlayer('human', 'Hero', '#00f0ff', mockWs);
    room.addBot('hard');

    room.setPlayerReady('human', true);
    expect(room.getPhase()).toBe('countdown');

    // Allow ticks to process
    await new Promise((r) => setTimeout(r, 70));

    const state = room.getRoomState();
    expect(Object.keys(state.players).length).toBe(2);
  });
});
