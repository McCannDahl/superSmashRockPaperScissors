export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape: 'circle' | 'square' | 'line' | 'ring';
}

export class ParticleSystem {
  private particles: Particle[] = [];

  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Slight drag & gravity for physical particles
      if (p.shape !== 'ring') {
        p.vy += 400 * dt;
        p.vx *= 0.95;
      }

      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'ring') {
        ctx.lineWidth = 4;
        ctx.beginPath();
        const currentRadius = p.size * (p.life / p.maxLife);
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'line') {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  public emitJumpDust(x: number, y: number): void {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y,
        vx: (Math.random() - 0.5) * 120,
        vy: -Math.random() * 60 - 20,
        color: 'rgba(200, 220, 255, 0.8)',
        size: Math.random() * 4 + 3,
        alpha: 0.8,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.15,
        shape: 'circle',
      });
    }
  }

  public emitClashShockwave(x: number, y: number): void {
    // Shockwave ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 90,
      alpha: 1.0,
      life: 0,
      maxLife: 0.3,
      shape: 'ring',
    });

    // Radiant sparks
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 250 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#ffcc00' : '#00f0ff',
        size: 4,
        alpha: 1.0,
        life: 0,
        maxLife: 0.35,
        shape: 'line',
      });
    }
  }

  public emitRockHitDebris(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 350,
        vy: -Math.random() * 250 - 50,
        color: Math.random() > 0.4 ? '#ffaa00' : '#888888',
        size: Math.random() * 6 + 4,
        alpha: 1.0,
        life: 0,
        maxLife: 0.4 + Math.random() * 0.2,
        shape: 'square',
      });
    }
  }

  public emitScissorsSparks(x: number, y: number): void {
    for (let i = 0; i < 16; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 400,
        vy: (Math.random() - 0.5) * 400,
        color: '#ffff33',
        size: 3,
        alpha: 1.0,
        life: 0,
        maxLife: 0.25,
        shape: 'line',
      });
    }
  }

  public emitPaperFlutter(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 200 - 40,
        color: '#00f0ff',
        size: Math.random() * 6 + 4,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5,
        shape: 'square',
      });
    }
  }

  public emitBlastZoneExplosion(x: number, y: number): void {
    // Large shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ff0055',
      size: 160,
      alpha: 1.0,
      life: 0,
      maxLife: 0.45,
      shape: 'ring',
    });

    // Explosive bursts
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 300 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.5 ? '#ff0055' : '#ffcc00',
        size: Math.random() * 7 + 4,
        alpha: 1.0,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        shape: Math.random() > 0.5 ? 'square' : 'circle',
      });
    }
  }
}
