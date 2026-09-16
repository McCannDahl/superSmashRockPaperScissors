export class AnalyticsClient {
  private endpoint: string;

  constructor() {
    this.endpoint = '/api/analytics/events';
  }

  public track(name: string, payload?: Record<string, any>): void {
    const data = JSON.stringify({
      name,
      payload,
      timestamp: Date.now(),
    });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(this.endpoint, blob);
    } else if (typeof fetch !== 'undefined') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
      }).catch(() => {
        // Silently ignore telemetry failure
      });
    }
  }
}

export const analyticsClient = new AnalyticsClient();
