import { WebSocket } from 'ws';
import { GameRoom } from './GameRoom.js';
import { ClientMessage, ServerMessage } from '@rps-boom/shared';
import { sanitizePlayerName } from '../security/RateLimiter.js';

export class RoomManager {
  private rooms: Map<string, GameRoom> = new Map(); // roomId -> GameRoom
  private codeToRoomId: Map<string, string> = new Map(); // roomCode -> roomId
  private socketToPlayer: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

  constructor() {
    // Periodic cleanup of empty rooms every 60s
    setInterval(() => {
      this.cleanupEmptyRooms();
    }, 60000);
  }

  public getActiveRoomCount(): number {
    return this.rooms.size;
  }

  public getTotalPlayerCount(): number {
    return this.socketToPlayer.size;
  }

  public handleConnection(ws: WebSocket): void {
    ws.on('message', (raw: string | Buffer) => {
      try {
        const text = typeof raw === 'string' ? raw : raw.toString('utf-8');
        const message = JSON.parse(text) as ClientMessage;
        this.routeMessage(ws, message);
      } catch (err) {
        this.sendError(ws, 'Invalid JSON payload received');
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', () => {
      this.handleDisconnection(ws);
    });
  }

  public handleDisconnection(ws: WebSocket): void {
    const session = this.socketToPlayer.get(ws);
    if (!session) return;

    this.socketToPlayer.delete(ws);
    const room = this.rooms.get(session.roomId);
    if (room) {
      room.removePlayer(session.playerId);
      if (room.isEmpty()) {
        this.deleteRoom(room);
      }
    }
  }

  private routeMessage(ws: WebSocket, message: ClientMessage): void {
    if (message.type === 'join_room') {
      this.handleJoinRoom(ws, message.payload);
      return;
    }

    const session = this.socketToPlayer.get(ws);
    if (!session) {
      this.sendError(ws, 'Must join a room before sending gameplay actions');
      return;
    }

    const room = this.rooms.get(session.roomId);
    if (!room) {
      this.sendError(ws, 'Room no longer exists');
      return;
    }

    switch (message.type) {
      case 'set_ready':
        room.setPlayerReady(session.playerId, message.payload.ready);
        break;
      case 'player_input':
        room.handlePlayerInput(session.playerId, message.payload);
        break;
      case 'request_rematch':
        room.handleRematchRequest(session.playerId);
        break;
      default:
        break;
    }
  }

  private handleJoinRoom(ws: WebSocket, payload: { name: string; color?: string; roomCode?: string; isPrivate?: boolean }): void {
    const playerName = sanitizePlayerName(payload.name);
    const playerColor = payload.color || this.getRandomColor();
    const playerId = `usr_${Math.random().toString(36).substring(2, 9)}`;

    let targetRoom: GameRoom | null = null;

    if (payload.roomCode) {
      const upperCode = payload.roomCode.toUpperCase().trim();
      const roomId = this.codeToRoomId.get(upperCode);
      if (roomId) {
        targetRoom = this.rooms.get(roomId) || null;
      }
      if (!targetRoom) {
        this.sendError(ws, `Room with code '${upperCode}' not found`);
        return;
      }
    } else if (payload.isPrivate) {
      targetRoom = this.createRoom(true);
    } else {
      // Find open public room in lobby with space (< 4 players)
      for (const room of this.rooms.values()) {
        if (!room.isPrivate && room.getPhase() === 'lobby' && room.getPlayerCount() < 4) {
          targetRoom = room;
          break;
        }
      }
      // Or create new public room
      if (!targetRoom) {
        targetRoom = this.createRoom(false);
      }
    }

    if (targetRoom.getPlayerCount() >= 4) {
      this.sendError(ws, 'Room is already full (maximum 4 players)');
      return;
    }

    this.socketToPlayer.set(ws, { roomId: targetRoom.id, playerId });
    targetRoom.addPlayer(playerId, playerName, playerColor, ws);

    // Send initial join confirmation
    const welcome: ServerMessage = {
      type: 'room_joined',
      payload: {
        playerId,
        roomState: targetRoom.getRoomState(),
      },
    };
    ws.send(JSON.stringify(welcome));
  }

  private createRoom(isPrivate: boolean): GameRoom {
    const id = `rm_${Math.random().toString(36).substring(2, 10)}`;
    const code = this.generateRoomCode();
    const room = new GameRoom(id, code, isPrivate);

    this.rooms.set(id, room);
    this.codeToRoomId.set(code, id);

    return room;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.codeToRoomId.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  private deleteRoom(room: GameRoom): void {
    room.destroy();
    this.rooms.delete(room.id);
    this.codeToRoomId.delete(room.code);
  }

  private cleanupEmptyRooms(): void {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.isEmpty() && now - room.createdAt > 30000) {
        this.deleteRoom(room);
      }
    }
  }

  private sendError(ws: WebSocket, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      const err: ServerMessage = {
        type: 'error_message',
        payload: { message },
      };
      ws.send(JSON.stringify(err));
    }
  }

  private getRandomColor(): string {
    const vibrantColors = [
      '#00f0ff', // Cyber Cyan
      '#ff0055', // Hot Pink
      '#ffcc00', // Electric Gold
      '#39ff14', // Neon Lime
      '#9933ff', // Plasma Purple
      '#ff6600', // Blazing Orange
    ];
    return vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
  }

  public shutdown(): void {
    for (const room of this.rooms.values()) {
      room.destroy();
    }
    this.rooms.clear();
    this.codeToRoomId.clear();
    this.socketToPlayer.clear();
  }
}
