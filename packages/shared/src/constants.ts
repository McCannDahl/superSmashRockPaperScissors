import { AttackType } from './types.js';

export const GAME_CONSTANTS = {
  // Server simulation
  TICK_RATE: 30,
  TICK_INTERVAL_MS: 1000 / 30, // ~33.33ms
  PHYSICS_SUBSTEPS: 2,
  
  // Player Dimensions
  PLAYER_WIDTH: 36,
  PLAYER_HEIGHT: 48,
  
  // Movement Physics
  GRAVITY: 1600, // px/s^2
  GROUND_MOVE_ACCEL: 2400,
  GROUND_MOVE_SPEED_MAX: 360,
  AIR_MOVE_ACCEL: 1600,
  AIR_MOVE_SPEED_MAX: 320,
  JUMP_VELOCITY: -680, // px/s upward
  MAX_FALL_SPEED: 850,
  GROUND_FRICTION: 0.82,
  AIR_DRAG: 0.96,
  
  // Combat Rules
  INITIAL_LIVES: 3,
  SPAWN_INVULNERABILITY_SEC: 2.5,
  COUNTDOWN_DURATION_SEC: 3.0,
  ROUND_OVER_DURATION_SEC: 3.5,
  
  // Maximum distance for two attacks to register as a clash
  CLASH_MAX_DISTANCE: 110,
  // Recoil velocity applied to both players during a tie
  TIE_RECOIL_VELOCITY_X: 420,
  TIE_RECOIL_VELOCITY_Y: -150,
  
  // Hitstun duration base & scaling
  HITSTUN_BASE_SEC: 0.22,
  HITSTUN_SCALING: 0.003,
} as const;

export interface AttackConfig {
  type: AttackType;
  damage: number;
  baseKnockback: number;
  knockbackScaling: number; // Multiplied by (damagePercent / 100)
  startupSec: number;
  activeSec: number;
  recoverySec: number;
  range: number;
  // Knockback trajectory angle in degrees (0 = straight right, 90 = straight up, etc.)
  launchAngleDeg: number;
}

export const ATTACK_CONFIGS: Record<AttackType, AttackConfig> = {
  rock: {
    type: 'rock',
    damage: 16,
    baseKnockback: 460,
    knockbackScaling: 9.2,
    startupSec: 0.16,
    activeSec: 0.14,
    recoverySec: 0.22,
    range: 75,
    launchAngleDeg: 35, // Horizontal heavy launch
  },
  paper: {
    type: 'paper',
    damage: 13,
    baseKnockback: 400,
    knockbackScaling: 8.0,
    startupSec: 0.12,
    activeSec: 0.18,
    recoverySec: 0.20,
    range: 92, // Widest range/reach
    launchAngleDeg: 80, // Steep vertical launch / anti-air
  },
  scissors: {
    type: 'scissors',
    damage: 14,
    baseKnockback: 430,
    knockbackScaling: 8.6,
    startupSec: 0.08, // Fastest startup
    activeSec: 0.12,
    recoverySec: 0.18,
    range: 78,
    launchAngleDeg: 55, // Diagonal balanced launch
  },
};
