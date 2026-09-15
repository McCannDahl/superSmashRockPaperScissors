export type AttackType = 'rock' | 'paper' | 'scissors';

export interface Vector2D {
  x: number;
  y: number;
}

export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isOneWay?: boolean;
}

export interface BlastZones {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ArenaConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  platforms: Platform[];
  blastZones: BlastZones;
  spawnPoints: Vector2D[];
}

export type AttackPhase = 'startup' | 'active' | 'recovery';

export interface AttackState {
  type: AttackType;
  phase: AttackPhase;
  timer: number;
  totalStartup: number;
  totalActive: number;
  totalRecovery: number;
}

export interface PlayerInput {
  seq: number;
  moveX: number; // -1 to 1
  jump: boolean;
  attack: AttackType | null;
  timestamp: number;
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  isGrounded: boolean;
  damagePercent: number;
  lives: number;
  isEliminated: boolean;
  isInvulnerable: boolean;
  invulnerabilityTimer: number;
  attackState: AttackState | null;
  hitstunTimer: number;
  ready: boolean;
  isHost: boolean;
  isBot?: boolean;
  botDifficulty?: BotDifficulty;
  stats: {
    damageDealt: number;
    kos: number;
    clashesWon: number;
    clashesLost: number;
    clashesTied: number;
  };
}

export type MatchPhase = 'lobby' | 'countdown' | 'playing' | 'round_over' | 'match_over';

export interface RoomState {
  id: string;
  code: string;
  isPrivate: boolean;
  phase: MatchPhase;
  countdownTimer: number;
  winnerId: string | null;
  players: Record<string, PlayerState>;
  arena: ArenaConfig;
  tick: number;
}

export type ClashOutcome = 'winner_a' | 'winner_b' | 'tie';

export interface ClashResult {
  playerAId: string;
  playerBId: string;
  attackA: AttackType;
  attackB: AttackType;
  outcome: ClashOutcome;
  winnerId: string | null;
  loserId: string | null;
  damageDealt: number;
  knockbackA: Vector2D;
  knockbackB: Vector2D;
  clashX: number;
  clashY: number;
}

export type CombatEventType = 'clash' | 'hit' | 'elimination' | 'respawn' | 'match_end';

export interface ClashCombatEvent {
  type: 'clash';
  playerAId: string;
  playerBId: string;
  attackA: AttackType;
  attackB: AttackType;
  outcome: ClashOutcome;
  winnerId: string | null;
  loserId: string | null;
  x: number;
  y: number;
  timestamp: number;
}

export interface HitCombatEvent {
  type: 'hit';
  attackerId: string;
  victimId: string;
  attack: AttackType;
  damage: number;
  x: number;
  y: number;
  knockback: Vector2D;
  timestamp: number;
}

export interface EliminationCombatEvent {
  type: 'elimination';
  playerId: string;
  livesRemaining: number;
  killerId: string | null;
  x: number;
  y: number;
  timestamp: number;
}

export interface RespawnCombatEvent {
  type: 'respawn';
  playerId: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface MatchEndCombatEvent {
  type: 'match_end';
  winnerId: string | null;
  timestamp: number;
}

export type CombatEvent =
  | ClashCombatEvent
  | HitCombatEvent
  | EliminationCombatEvent
  | RespawnCombatEvent
  | MatchEndCombatEvent;

export type BotDifficulty = 'easy' | 'medium' | 'hard';

// WebSocket Protocol Messages
export type ClientMessageType =
  | 'join_room'
  | 'set_ready'
  | 'player_input'
  | 'request_rematch'
  | 'add_bot'
  | 'remove_bot';

export interface JoinRoomPayload {
  name: string;
  color?: string;
  roomCode?: string;
  isPrivate?: boolean;
  isSolo?: boolean;
  botDifficulty?: BotDifficulty;
}

export interface SetReadyPayload {
  ready: boolean;
}

export interface PlayerInputPayload extends PlayerInput {}

export interface RequestRematchPayload {}

export interface AddBotPayload {
  difficulty: BotDifficulty;
}

export interface RemoveBotPayload {
  botId: string;
}

export type ClientMessage =
  | { type: 'join_room'; payload: JoinRoomPayload }
  | { type: 'set_ready'; payload: SetReadyPayload }
  | { type: 'player_input'; payload: PlayerInputPayload }
  | { type: 'request_rematch'; payload?: RequestRematchPayload }
  | { type: 'add_bot'; payload: AddBotPayload }
  | { type: 'remove_bot'; payload: RemoveBotPayload };

export type ServerMessageType =
  | 'room_joined'
  | 'state_update'
  | 'error_message';

export interface RoomJoinedPayload {
  playerId: string;
  roomState: RoomState;
}

export interface StateUpdatePayload {
  tick: number;
  phase: MatchPhase;
  countdownTimer: number;
  winnerId: string | null;
  players: Record<string, PlayerState>;
  events: CombatEvent[];
}

export interface ErrorMessagePayload {
  message: string;
  code?: string;
}

export type ServerMessage =
  | { type: 'room_joined'; payload: RoomJoinedPayload }
  | { type: 'state_update'; payload: StateUpdatePayload }
  | { type: 'error_message'; payload: ErrorMessagePayload };
