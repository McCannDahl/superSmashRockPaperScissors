import {
  ArenaConfig,
  AttackType,
  BotDifficulty,
  GAME_CONSTANTS,
  PlayerInput,
  PlayerState,
  Platform,
} from '@rps-boom/shared';

export class BotPlayer {
  public readonly id: string;
  public readonly name: string;
  public readonly color: string;
  public readonly difficulty: BotDifficulty;
  private seq: number = 0;
  private actionCooldown: number = 0;
  private attackCooldown: number = 0;
  private currentMoveX: number = 0;
  private currentJump: boolean = false;
  private currentAttack: AttackType | null = null;
  private opponentLastAttacks: AttackType[] = [];

  constructor(id: string, name: string, color: string, difficulty: BotDifficulty = 'medium') {
    this.id = id;
    this.name = name;
    this.color = color;
    this.difficulty = difficulty;
  }

  public update(
    dt: number,
    myState: PlayerState,
    allPlayers: Record<string, PlayerState>,
    arena: ArenaConfig
  ): PlayerInput {
    this.seq++;
    this.actionCooldown = Math.max(0, this.actionCooldown - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);

    // If eliminated or in hitstun, cannot make inputs
    if (myState.isEliminated || myState.hitstunTimer > 0) {
      return {
        seq: this.seq,
        moveX: 0,
        jump: false,
        attack: null,
        timestamp: Date.now(),
      };
    }

    // Find nearest live opponent
    const target = this.findNearestOpponent(myState, allPlayers);

    // Navigation & Off-Stage Recovery
    this.evaluateNavigation(myState, target, arena, dt);

    // Combat & Attack Selection
    this.evaluateCombat(myState, target, dt);

    const input: PlayerInput = {
      seq: this.seq,
      moveX: this.currentMoveX,
      jump: this.currentJump,
      attack: this.currentAttack,
      timestamp: Date.now(),
    };

    // Consume one-shot triggers
    this.currentJump = false;
    this.currentAttack = null;

    return input;
  }

  private findNearestOpponent(
    myState: PlayerState,
    allPlayers: Record<string, PlayerState>
  ): PlayerState | null {
    let nearest: PlayerState | null = null;
    let minDist = Infinity;

    for (const p of Object.values(allPlayers)) {
      if (p.id === this.id || p.isEliminated) continue;

      const dist = Math.hypot(p.x - myState.x, p.y - myState.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }

    return nearest;
  }

  private evaluateNavigation(
    myState: PlayerState,
    target: PlayerState | null,
    arena: ArenaConfig,
    dt: number
  ): void {
    const mainGround = arena.platforms.find((p) => p.id === 'main_ground') || arena.platforms[0];
    const stageMinX = mainGround.x;
    const stageMaxX = mainGround.x + mainGround.width;
    const stageCenterX = mainGround.x + mainGround.width / 2;

    // 1. RECOVERY: Check if off-stage (dangerously close to or outside main platform edges)
    const isOffStageLeft = myState.x < stageMinX - 20;
    const isOffStageRight = myState.x > stageMaxX + 20;
    const isBelowStage = myState.y > mainGround.y;

    if (isOffStageLeft || isOffStageRight || isBelowStage) {
      // Steer back to center stage
      this.currentMoveX = myState.x < stageCenterX ? 1 : -1;

      // Jump to recover back onto the stage
      if (myState.isGrounded || myState.vy > 40) {
        this.currentJump = true;
      }
      return;
    }

    // 2. TARGET TRACKING: Move toward opponent if one exists
    if (!target) {
      this.currentMoveX = 0;
      return;
    }

    // Reaction timing by difficulty
    const reactionInterval =
      this.difficulty === 'hard' ? 0.04 : this.difficulty === 'medium' ? 0.08 : 0.16;

    if (this.actionCooldown <= 0) {
      this.actionCooldown = reactionInterval;

      const dx = target.x - myState.x;
      const dy = target.y - myState.y;
      const absDx = Math.abs(dx);

      // Check current platform
      const currentPlatform = this.getCurrentPlatform(myState, arena);

      // Desired direction
      let desiredDir = dx > 15 ? 1 : dx < -15 ? -1 : 0;

      // Platform edge safety check: prevent walking off into the abyss
      if (myState.isGrounded && currentPlatform) {
        const platLeft = currentPlatform.x;
        const platRight = currentPlatform.x + currentPlatform.width;

        // If walking left past edge with no platform below
        if (desiredDir === -1 && myState.x <= platLeft + 18) {
          // If target is above or across, jump across gap instead of falling
          if (target.y < myState.y + 40) {
            this.currentJump = true;
          } else if (currentPlatform.id === 'main_ground') {
            // Main stage edge: stop walking off!
            desiredDir = 0;
          }
        }

        // If walking right past edge with no platform below
        if (desiredDir === 1 && myState.x >= platRight - 18) {
          if (target.y < myState.y + 40) {
            this.currentJump = true;
          } else if (currentPlatform.id === 'main_ground') {
            desiredDir = 0;
          }
        }
      }

      this.currentMoveX = desiredDir;

      // Vertical navigation: Jump to reach target on higher platform
      if (dy < -60 && absDx < 160 && myState.isGrounded) {
        this.currentJump = true;
      }

      // Jump over incoming attacks or jump attack if target is in air
      if (target.attackState && target.attackState.phase === 'startup' && absDx < 90) {
        if (this.difficulty === 'hard' || (this.difficulty === 'medium' && Math.random() < 0.6)) {
          this.currentJump = true;
        }
      }
    }
  }

  private evaluateCombat(myState: PlayerState, target: PlayerState | null, dt: number): void {
    if (!target || myState.attackState !== null || this.attackCooldown > 0) {
      return;
    }

    const dist = Math.hypot(target.x - myState.x, target.y - myState.y);
    const inAttackRange = dist <= 82;

    if (!inAttackRange) return;

    // Cooldown between bot attack attempts based on difficulty
    const cooldownTime =
      this.difficulty === 'hard' ? 0.35 : this.difficulty === 'medium' ? 0.55 : 0.85;

    this.attackCooldown = cooldownTime;
    this.currentAttack = this.chooseAttack(target);
  }

  private chooseAttack(target: PlayerState): AttackType {
    const attacks: AttackType[] = ['rock', 'paper', 'scissors'];

    // Easy: pure random choice
    if (this.difficulty === 'easy') {
      return attacks[Math.floor(Math.random() * attacks.length)];
    }

    // If target is attacking, counter target's active/startup attack!
    if (target.attackState) {
      const targetAtk = target.attackState.type;
      const counter = this.getWinningCounter(targetAtk);

      if (this.difficulty === 'hard') {
        // 90% probability to execute exact counter
        if (Math.random() < 0.9) {
          return counter;
        }
      } else if (this.difficulty === 'medium') {
        // 60% probability to counter
        if (Math.random() < 0.6) {
          return counter;
        }
      }
    }

    // Medium: smart mixup (prefers Rock/Scissors for quick launches)
    if (this.difficulty === 'medium') {
      const weights = [0.38, 0.28, 0.34];
      const r = Math.random();
      if (r < weights[0]) return 'rock';
      if (r < weights[0] + weights[1]) return 'paper';
      return 'scissors';
    }

    // Hard: predictive counter based on damage %
    // If target has high damage, use heavy launch (Rock or Scissors)
    if (target.damagePercent > 70) {
      return Math.random() < 0.6 ? 'rock' : 'scissors';
    }

    return attacks[Math.floor(Math.random() * attacks.length)];
  }

  private getWinningCounter(attack: AttackType): AttackType {
    if (attack === 'rock') return 'paper';
    if (attack === 'paper') return 'scissors';
    return 'rock';
  }

  private getCurrentPlatform(myState: PlayerState, arena: ArenaConfig): Platform | null {
    for (const plat of arena.platforms) {
      const isWithinX = myState.x >= plat.x - 10 && myState.x <= plat.x + plat.width + 10;
      const isAtY = Math.abs(myState.y - plat.y) < 8;
      if (isWithinX && isAtY) {
        return plat;
      }
    }
    return null;
  }
}
