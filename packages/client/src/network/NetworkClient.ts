import {
  AttackType,
  ClientMessage,
  CombatEvent,
  MatchPhase,
  PlayerInput,
  PlayerState,
  RoomState,
  ServerMessage,
} from '@rps-boom/shared';

export type StateListener = (
  tick: number,
  phase: MatchPhase,
  countdownTimer: number,
  winnerId: string | null,
  players: Record<string, PlayerState>,
  events: CombatEvent[]
) => void;

export type RoomJoinedListener = (playerId: string, roomState: RoomState) => void;
export type ErrorListener = (message: string) => void;

export class NetworkClient {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private seq: number = 0;
  private stateListeners: StateListener[] = [];
  private roomJoinedListeners: RoomJoinedListener[] = [];
  private errorListeners: ErrorListener[] = [];
  private localPlayerId: string | null = null;

  constructor(serverUrl?: string) {
    if (serverUrl) {
      this.serverUrl = serverUrl;
    } else {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, if client on 5173, point to backend 3000
      if (loc.port === '5173') {
        this.serverUrl = `${protocol}//${loc.hostname}:3000`;
      } else {
        this.serverUrl = `${protocol}//${loc.host}`;
      }
    }
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onerror = (err) => {
        reject(err);
      };

      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data) as ServerMessage;
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('Failed to parse server message', e);
        }
      };

      this.ws.onclose = () => {
        // Disconnected
      };
    });
  }

  public onStateUpdate(listener: StateListener): void {
    this.stateListeners.push(listener);
  }

  public onRoomJoined(listener: RoomJoinedListener): void {
    this.roomJoinedListeners.push(listener);
  }

  public onError(listener: ErrorListener): void {
    this.errorListeners.push(listener);
  }

  public getLocalPlayerId(): string | null {
    return this.localPlayerId;
  }

  public joinRoom(name: string, color?: string, roomCode?: string, isPrivate?: boolean): void {
    const msg: ClientMessage = {
      type: 'join_room',
      payload: { name, color, roomCode, isPrivate },
    };
    this.send(msg);
  }

  public setReady(ready: boolean): void {
    const msg: ClientMessage = {
      type: 'set_ready',
      payload: { ready },
    };
    this.send(msg);
  }

  public sendInput(moveX: number, jump: boolean, attack: AttackType | null): void {
    this.seq++;
    const input: PlayerInput = {
      seq: this.seq,
      moveX,
      jump,
      attack,
      timestamp: Date.now(),
    };

    const msg: ClientMessage = {
      type: 'player_input',
      payload: input,
    };
    this.send(msg);
  }

  public requestRematch(): void {
    const msg: ClientMessage = {
      type: 'request_rematch',
      payload: {},
    };
    this.send(msg);
  }

  private send(msg: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleServerMessage(msg: ServerMessage): void {
    if (msg.type === 'room_joined') {
      this.localPlayerId = msg.payload.playerId;
      for (const listener of this.roomJoinedListeners) {
        listener(msg.payload.playerId, msg.payload.roomState);
      }
    } else if (msg.type === 'state_update') {
      const p = msg.payload;
      for (const listener of this.stateListeners) {
        listener(p.tick, p.phase, p.countdownTimer, p.winnerId, p.players, p.events);
      }
    } else if (msg.type === 'error_message') {
      for (const listener of this.errorListeners) {
        listener(msg.payload.message);
      }
    }
  }
}
