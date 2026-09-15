export interface AnalyticsEvent {
  name: string;
  payload?: Record<string, any>;
  timestamp: number;
}

export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly maxStoredEvents = 1000;
  private matchesPlayed = 0;
  private totalClashes = 0;
  private rpsDistribution = { rock: 0, paper: 0, scissors: 0 };

  public trackEvent(name: string, payload?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      payload,
      timestamp: Date.now(),
    };

    this.events.push(event);
    if (this.events.length > this.maxStoredEvents) {
      this.events.shift();
    }

    if (name === 'match_completed') {
      this.matchesPlayed++;
    } else if (name === 'clash_resolved') {
      this.totalClashes++;
      const attackA = payload?.attackA as keyof typeof this.rpsDistribution;
      const attackB = payload?.attackB as keyof typeof this.rpsDistribution;
      if (attackA && this.rpsDistribution[attackA] !== undefined) {
        this.rpsDistribution[attackA]++;
      }
      if (attackB && this.rpsDistribution[attackB] !== undefined) {
        this.rpsDistribution[attackB]++;
      }
    }
  }

  public getSummary() {
    return {
      matchesPlayed: this.matchesPlayed,
      totalClashes: this.totalClashes,
      rpsDistribution: this.rpsDistribution,
      recentEventsCount: this.events.length,
    };
  }
}

export const analytics = new AnalyticsService();
