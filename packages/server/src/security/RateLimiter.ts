export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly capacity: number;
  private readonly refillRatePerSecond: number;

  constructor(capacity: number = 60, refillRatePerSecond: number = 40) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRatePerSecond = refillRatePerSecond;
    this.lastRefillTime = Date.now();
  }

  public allowRequest(tokensRequired: number = 1): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRatePerSecond);
    this.lastRefillTime = now;

    if (this.tokens >= tokensRequired) {
      this.tokens -= tokensRequired;
      return true;
    }
    return false;
  }
}

export function sanitizePlayerName(rawName: string | undefined): string {
  if (!rawName || typeof rawName !== 'string') {
    return `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  // Strip control chars, trim, limit length
  const cleaned = rawName.replace(/[^\w\s-]/gi, '').trim();
  if (cleaned.length === 0) {
    return `Player_${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return cleaned.slice(0, 16);
}
