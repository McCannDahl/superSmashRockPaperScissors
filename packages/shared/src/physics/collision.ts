import { AABB, Platform, BlastZones, PlayerState } from '../types.js';
import { GAME_CONSTANTS } from '../constants.js';

export function checkAABBOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getPlayerAABB(player: PlayerState): AABB {
  return {
    x: player.x - GAME_CONSTANTS.PLAYER_WIDTH / 2,
    y: player.y - GAME_CONSTANTS.PLAYER_HEIGHT,
    width: GAME_CONSTANTS.PLAYER_WIDTH,
    height: GAME_CONSTANTS.PLAYER_HEIGHT,
  };
}

export function isPlayerInBlastZone(player: PlayerState, blastZones: BlastZones): boolean {
  return (
    player.x < blastZones.minX ||
    player.x > blastZones.maxX ||
    player.y < blastZones.minY ||
    player.y > blastZones.maxY
  );
}

/**
 * Resolves platform vertical collision.
 * For solid platforms: standard landing.
 * For one-way platforms: can jump through from below; lands when falling through the top edge.
 */
export function resolvePlatformCollision(
  player: PlayerState,
  platform: Platform,
  prevY: number
): boolean {
  const playerWidth = GAME_CONSTANTS.PLAYER_WIDTH;
  const playerHalfWidth = playerWidth / 2;
  const playerBottom = player.y;
  const prevPlayerBottom = prevY;

  // Horizontal overlap check
  const playerLeft = player.x - playerHalfWidth;
  const playerRight = player.x + playerHalfWidth;
  const platformLeft = platform.x;
  const platformRight = platform.x + platform.width;

  const horizontalOverlap = playerRight > platformLeft && playerLeft < platformRight;
  if (!horizontalOverlap) {
    return false;
  }

  // Check if player crossed platform surface from above
  const platformTop = platform.y;
  const platformBottom = platform.y + platform.height;

  // Falling down
  if (player.vy >= 0) {
    // Was at or above the platform in previous frame, and is now at or below platform top
    if (prevPlayerBottom <= platformTop + 6 && playerBottom >= platformTop) {
      player.y = platformTop;
      player.vy = 0;
      player.isGrounded = true;
      return true;
    }
  }

  // If not one-way, also check bumping head or side collisions
  if (!platform.isOneWay) {
    const playerTop = player.y - GAME_CONSTANTS.PLAYER_HEIGHT;
    // Bumping head from below
    if (player.vy < 0 && playerTop < platformBottom && prevPlayerBottom - GAME_CONSTANTS.PLAYER_HEIGHT >= platformBottom) {
      player.y = platformBottom + GAME_CONSTANTS.PLAYER_HEIGHT;
      player.vy = 0;
      return false;
    }
  }

  return false;
}
