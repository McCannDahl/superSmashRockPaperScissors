import { AttackType, ClashOutcome, ClashResult, PlayerState, Vector2D } from '../types.js';
import { ATTACK_CONFIGS, GAME_CONSTANTS } from '../constants.js';

/**
 * Determines the winner of an RPS confrontation.
 * Returns 'winner_a', 'winner_b', or 'tie'.
 */
export function determineRpsWinner(attackA: AttackType, attackB: AttackType): ClashOutcome {
  if (attackA === attackB) {
    return 'tie';
  }

  if (
    (attackA === 'rock' && attackB === 'scissors') ||
    (attackA === 'scissors' && attackB === 'paper') ||
    (attackA === 'paper' && attackB === 'rock')
  ) {
    return 'winner_a';
  }

  return 'winner_b';
}

/**
 * Calculates knockback vector applied to a defender.
 * Scaled by the defender's damage percentage: MORE DAMAGE -> MORE KNOCKBACK.
 */
export function calculateKnockback(
  attacker: PlayerState,
  defender: PlayerState,
  attackType: AttackType,
  isClashWinner: boolean = false
): Vector2D {
  const config = ATTACK_CONFIGS[attackType];
  
  // Accumulated damage scaling factor
  const damageFactor = defender.damagePercent / 100;
  // Knockback magnitude
  const bonusMultiplier = isClashWinner ? 1.25 : 1.0;
  const speed = (config.baseKnockback + damageFactor * config.knockbackScaling * 100) * bonusMultiplier;

  // Determine direction: push away from attacker
  const dirX = defender.x >= attacker.x ? 1 : -1;
  const angleRad = (config.launchAngleDeg * Math.PI) / 180;

  // Horizontal and vertical components (negative Y is upward)
  const vx = Math.cos(angleRad) * speed * dirX;
  const vy = -Math.sin(angleRad) * speed;

  return { x: vx, y: vy };
}

/**
 * Resolves an active attack clash between two players.
 */
export function resolveClash(
  playerA: PlayerState,
  attackA: AttackType,
  playerB: PlayerState,
  attackB: AttackType
): ClashResult {
  const outcome = determineRpsWinner(attackA, attackB);
  const clashX = (playerA.x + playerB.x) / 2;
  const clashY = (playerA.y + playerB.y) / 2;

  if (outcome === 'tie') {
    // Both players bounce backward away from each other with zero damage
    const dirA = playerA.x <= playerB.x ? -1 : 1;
    const dirB = -dirA;

    return {
      playerAId: playerA.id,
      playerBId: playerB.id,
      attackA,
      attackB,
      outcome: 'tie',
      winnerId: null,
      loserId: null,
      damageDealt: 0,
      knockbackA: {
        x: dirA * GAME_CONSTANTS.TIE_RECOIL_VELOCITY_X,
        y: GAME_CONSTANTS.TIE_RECOIL_VELOCITY_Y,
      },
      knockbackB: {
        x: dirB * GAME_CONSTANTS.TIE_RECOIL_VELOCITY_X,
        y: GAME_CONSTANTS.TIE_RECOIL_VELOCITY_Y,
      },
      clashX,
      clashY,
    };
  }

  if (outcome === 'winner_a') {
    const config = ATTACK_CONFIGS[attackA];
    const knockback = calculateKnockback(playerA, playerB, attackA, true);

    return {
      playerAId: playerA.id,
      playerBId: playerB.id,
      attackA,
      attackB,
      outcome: 'winner_a',
      winnerId: playerA.id,
      loserId: playerB.id,
      damageDealt: config.damage,
      knockbackA: { x: 0, y: 0 },
      knockbackB: knockback,
      clashX,
      clashY,
    };
  }

  // outcome === 'winner_b'
  const config = ATTACK_CONFIGS[attackB];
  const knockback = calculateKnockback(playerB, playerA, attackB, true);

  return {
    playerAId: playerA.id,
    playerBId: playerB.id,
    attackA,
    attackB,
    outcome: 'winner_b',
    winnerId: playerB.id,
    loserId: playerA.id,
    damageDealt: config.damage,
    knockbackA: knockback,
    knockbackB: { x: 0, y: 0 },
    clashX,
    clashY,
  };
}
