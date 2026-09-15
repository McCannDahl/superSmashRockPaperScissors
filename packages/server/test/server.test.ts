import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameRoom } from '../src/rooms/GameRoom.js';
import { RoomManager } from '../src/rooms/RoomManager.js';
import { WebSocket } from 'ws';

// Mock WebSocket
class MockWebSocket {
  public readyState = WebSocket.OPEN;
  public sentMessages: string[] = [];

  public send(msg: string) {
    this.sentMessages.push(msg);
  }

  public close() {
    this.readyState = WebSocket.CLOSED;
  }
}

describe('GameRoom Simulation & State Machine', () => {
  let room: GameRoom;
  let ws1: MockWebSocket;
  let ws2: MockWebSocket;

  beforeEach(() => {
    room = new GameRoom('test_room', 'TEST1', false);
    ws1 = new MockWebSocket();
    ws2 = new MockWebSocket();
  });

  afterEach(() => {
    room.destroy();
  });

  it('adds players and assigns host status to first player', () => {
    const p1 = room.addPlayer('p1', 'Alice', '#00f0ff', ws1 as unknown as WebSocket);
    const p2 = room.addPlayer('p2', 'Bob', '#ff0055', ws2 as unknown as WebSocket);

    expect(room.getPlayerCount()).toBe(2);
    expect(p1.isHost).toBe(true);
    expect(p2.isHost).toBe(false);
    expect(p1.lives).toBe(3);
    expect(p2.lives).toBe(3);
  });

  it('triggers countdown when all players are ready in lobby', () => {
    room.addPlayer('p1', 'Alice', '#00f0ff', ws1 as unknown as WebSocket);
    room.addPlayer('p2', 'Bob', '#ff0055', ws2 as unknown as WebSocket);

    expect(room.getPhase()).toBe('lobby');

    room.setPlayerReady('p1', true);
    expect(room.getPhase()).toBe('lobby');

    room.setPlayerReady('p2', true);
    expect(room.getPhase()).toBe('countdown');
  });

  it('handles player inputs and processes simulation tick', async () => {
    room.addPlayer('p1', 'Alice', '#00f0ff', ws1 as unknown as WebSocket);
    room.addPlayer('p2', 'Bob', '#ff0055', ws2 as unknown as WebSocket);

    // Set ready to start countdown
    room.setPlayerReady('p1', true);
    room.setPlayerReady('p2', true);

    // Send input to p1
    room.handlePlayerInput('p1', {
      seq: 1,
      moveX: 1,
      jump: false,
      attack: 'rock',
      timestamp: Date.now(),
    });

    // Let simulation tick
    await new Promise((r) => setTimeout(r, 60));

    expect(ws1.sentMessages.length).toBeGreaterThan(0);
    const lastMsg = JSON.parse(ws1.sentMessages[ws1.sentMessages.length - 1]);
    expect(lastMsg.type).toBe('state_update');
    expect(lastMsg.payload.players['p1']).toBeDefined();
  });
});

describe('RoomManager Lifecycle', () => {
  it('instantiates and tracks room counts', () => {
    const manager = new RoomManager();
    expect(manager.getActiveRoomCount()).toBe(0);
    expect(manager.getTotalPlayerCount()).toBe(0);
    manager.shutdown();
  });
});
