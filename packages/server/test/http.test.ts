import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { WebSocketServer } from 'ws';
import { RoomManager } from '../src/rooms/RoomManager.js';
import { analytics } from '../src/analytics/AnalyticsService.js';

describe('HTTP & Telemetry Endpoints', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const roomManager = new RoomManager();
    server = http.createServer((req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);

      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            uptime: 100,
            rooms: roomManager.getActiveRoomCount(),
            players: roomManager.getTotalPlayerCount(),
          })
        );
        return;
      }

      if (url.pathname === '/api/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'online',
            uptime: 100,
            rooms: roomManager.getActiveRoomCount(),
            players: roomManager.getTotalPlayerCount(),
            analytics: analytics.getSummary(),
          })
        );
        return;
      }

      if (url.pathname === '/api/analytics/events' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const parsed = JSON.parse(body);
          analytics.trackEvent(parsed.name, parsed.payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        });
        return;
      }

      res.writeHead(404);
      res.end();
    });

    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          port = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('returns 200 OK and health json on /health', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.rooms).toBeDefined();
    expect(json.players).toBeDefined();
  });

  it('returns status metrics on /api/status', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/status`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('online');
    expect(json.analytics).toBeDefined();
  });

  it('accepts telemetry events on POST /api/analytics/events', async () => {
    const res = await fetch(`http://127.0.0.1:${port}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'clash_resolved',
        payload: { attackA: 'rock', attackB: 'scissors', outcome: 'winner_a' },
      }),
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    const summary = analytics.getSummary();
    expect(summary.totalClashes).toBeGreaterThan(0);
    expect(summary.rpsDistribution.rock).toBeGreaterThan(0);
  });
});
