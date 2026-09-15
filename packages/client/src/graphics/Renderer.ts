import { ArenaConfig, AttackType, CombatEvent, GAME_CONSTANTS, MatchPhase, PlayerState } from '@rps-boom/shared';
import { ParticleSystem } from './ParticleSystem.js';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public readonly particleSystem: ParticleSystem;
  private cameraShakeTime: number = 0;
  private cameraShakeIntensity: number = 0;
  private hitstopTimer: number = 0;
  private bannerText: string = '';
  private bannerTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to acquire 2D canvas context');
    }
    this.ctx = context;
    this.particleSystem = new ParticleSystem();

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    // Fixed logical internal resolution: 1200 x 800
    this.canvas.width = 1200;
    this.canvas.height = 800;
  }

  public triggerCameraShake(intensity: number = 10, durationSec: number = 0.2): void {
    this.cameraShakeIntensity = intensity;
    this.cameraShakeTime = durationSec;
  }

  public triggerHitstop(durationSec: number = 0.08): void {
    this.hitstopTimer = durationSec;
  }

  public showBanner(text: string, durationSec: number = 1.5): void {
    this.bannerText = text;
    this.bannerTimer = durationSec;
  }

  public render(
    dt: number,
    arena: ArenaConfig,
    players: Record<string, PlayerState>,
    phase: MatchPhase,
    countdownTimer: number,
    winnerId: string | null,
    localPlayerId: string | null
  ): void {
    const ctx = this.ctx;

    // Update screen shake
    if (this.cameraShakeTime > 0) {
      this.cameraShakeTime -= dt;
    } else {
      this.cameraShakeIntensity = 0;
    }

    // Update banner timer
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = '';
      }
    }

    // Update particles if not in hitstop
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    } else {
      this.particleSystem.update(dt);
    }

    // Clear background
    ctx.save();
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply Camera Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraShakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // Render Grid Background & Arena Environment
    this.renderArenaBackground(ctx, arena);

    // Render Platforms
    this.renderPlatforms(ctx, arena);

    // Render Particles
    this.particleSystem.render(ctx);

    // Render Players
    this.renderPlayers(ctx, players, localPlayerId);

    // Render Blast Zone Hazard Boundary Accents
    this.renderBlastZoneBounds(ctx, arena);

    // Render Phase Banners & Countdown
    this.renderOverlays(ctx, phase, countdownTimer, winnerId, players);

    ctx.restore();
  }

  private renderArenaBackground(ctx: CanvasRenderingContext2D, arena: ArenaConfig): void {
    // Subtle cyber grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;

    for (let x = 0; x < arena.width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, arena.height);
      ctx.stroke();
    }

    for (let y = 0; y < arena.height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(arena.width, y);
      ctx.stroke();
    }
  }

  private renderPlatforms(ctx: CanvasRenderingContext2D, arena: ArenaConfig): void {
    for (const p of arena.platforms) {
      // Platform body
      ctx.fillStyle = p.isOneWay ? '#161d2d' : '#1f293d';
      ctx.fillRect(p.x, p.y, p.width, p.height);

      // Glowing top border
      ctx.strokeStyle = p.isOneWay ? '#00f0ff' : '#00a3ff';
      ctx.lineWidth = p.isOneWay ? 2 : 4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.width, p.y);
      ctx.stroke();

      // Platform bottom highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + p.height);
      ctx.lineTo(p.x + p.width, p.y + p.height);
      ctx.stroke();
    }
  }

  private renderBlastZoneBounds(ctx: CanvasRenderingContext2D, arena: ArenaConfig): void {
    // Gentle red neon gradient at edges
    const gradLeft = ctx.createLinearGradient(0, 0, 50, 0);
    gradLeft.addColorStop(0, 'rgba(255, 0, 85, 0.25)');
    gradLeft.addColorStop(1, 'transparent');
    ctx.fillStyle = gradLeft;
    ctx.fillRect(0, 0, 50, arena.height);

    const gradRight = ctx.createLinearGradient(arena.width - 50, 0, arena.width, 0);
    gradRight.addColorStop(0, 'transparent');
    gradRight.addColorStop(1, 'rgba(255, 0, 85, 0.25)');
    ctx.fillStyle = gradRight;
    ctx.fillRect(arena.width - 50, 0, 50, arena.height);

    const gradBottom = ctx.createLinearGradient(0, arena.height - 60, 0, arena.height);
    gradBottom.addColorStop(0, 'transparent');
    gradBottom.addColorStop(1, 'rgba(255, 0, 85, 0.35)');
    ctx.fillStyle = gradBottom;
    ctx.fillRect(0, arena.height - 60, arena.width, 60);
  }

  private renderPlayers(
    ctx: CanvasRenderingContext2D,
    players: Record<string, PlayerState>,
    localPlayerId: string | null
  ): void {
    for (const p of Object.values(players)) {
      if (p.isEliminated) continue;

      ctx.save();

      // Invulnerability flash
      if (p.isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Hitstun vibration
      let px = p.x;
      let py = p.y;
      if (p.hitstunTimer > 0) {
        px += (Math.random() - 0.5) * 8;
        py += (Math.random() - 0.5) * 8;
      }

      const halfW = GAME_CONSTANTS.PLAYER_WIDTH / 2;
      const height = GAME_CONSTANTS.PLAYER_HEIGHT;

      // Local player indicator ring
      if (p.id === localPlayerId) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py - height / 2, halfW + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Fighter Body (Rounded Minimalist Rectangle)
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.attackState ? 16 : 6;
      this.drawRoundedRect(ctx, px - halfW, py - height, GAME_CONSTANTS.PLAYER_WIDTH, height, 8);
      ctx.fill();

      // Expressive Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      const eyeDir = p.facing;
      const eyeX = px + eyeDir * 6;
      const eyeY = py - height + 14;
      ctx.fillRect(eyeX - 3, eyeY - 4, 6, 8);
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(eyeX + (eyeDir > 0 ? 0 : -3), eyeY - 2, 3, 4);

      // Attack Symbol Overhead when attacking
      if (p.attackState) {
        this.renderAttackIndicator(ctx, px, py - height - 24, p.attackState.type, p.attackState.phase);
      }

      // Player Name & Damage % Overhead
      ctx.font = 'bold 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(p.name, px, py - height - (p.attackState ? 44 : 20));

      // Damage percentage color gradient (White -> Yellow -> Fiery Red)
      const dmg = Math.round(p.damagePercent);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = this.getDamageColor(dmg);
      ctx.fillText(`${dmg}%`, px, py - height - (p.attackState ? 30 : 6));

      // Stock lives dots
      for (let i = 0; i < p.lives; i++) {
        ctx.fillStyle = '#ff0055';
        ctx.beginPath();
        ctx.arc(px - (p.lives - 1) * 6 + i * 12, py + 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  private renderAttackIndicator(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    type: AttackType,
    phase: string
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // Pulse based on phase
    const scale = phase === 'active' ? 1.3 : 1.0;
    ctx.scale(scale, scale);

    // Background pill
    ctx.fillStyle = phase === 'active' ? '#ffff00' : 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    this.drawRoundedRect(ctx, -24, -14, 48, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Attack Icon / Text
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = phase === 'active' ? '#000000' : '#ffffff';

    if (type === 'rock') {
      ctx.fillText('✊ RCK', 0, 0);
    } else if (type === 'paper') {
      ctx.fillText('✋ PAP', 0, 0);
    } else {
      ctx.fillText('✌ SCI', 0, 0);
    }

    ctx.restore();
  }

  private renderOverlays(
    ctx: CanvasRenderingContext2D,
    phase: MatchPhase,
    countdownTimer: number,
    winnerId: string | null,
    players: Record<string, PlayerState>
  ): void {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;

    // Active Banner (e.g. Clash announcement)
    if (this.bannerText) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 70, this.canvas.width, 60);

      ctx.font = '900 28px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 12;
      ctx.fillText(this.bannerText, cx, 100);
      ctx.restore();
    }

    // Countdown Overlay
    if (phase === 'countdown') {
      ctx.save();
      const seconds = Math.ceil(countdownTimer);
      const text = seconds > 0 ? `${seconds}` : 'FIGHT!';

      ctx.font = '900 84px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = seconds > 0 ? '#00f0ff' : '#ff0055';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 24;
      ctx.fillText(text, cx, cy - 50);

      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText('READY YOUR ATTACK: Z = ROCK, X = PAPER, C = SCISSORS', cx, cy + 30);
      ctx.restore();
    }

    // Match Over Banner
    if (phase === 'match_over') {
      ctx.save();
      ctx.fillStyle = 'rgba(10, 13, 20, 0.75)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.font = '900 64px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 20;

      const winner = winnerId ? players[winnerId] : null;
      const winnerName = winner ? winner.name : 'NO ONE';
      ctx.fillText('MATCH COMPLETED!', cx, cy - 80);

      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(`WINNER: ${winnerName}`, cx, cy - 20);

      ctx.font = 'bold 18px Inter, sans-serif';
      ctx.fillStyle = '#00f0ff';
      ctx.fillText('Click REMATCH below to play again!', cx, cy + 40);
      ctx.restore();
    }
  }

  private getDamageColor(damage: number): string {
    if (damage < 40) return '#ffffff';
    if (damage < 80) return '#ffea00';
    if (damage < 120) return '#ff7700';
    return '#ff0044';
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
