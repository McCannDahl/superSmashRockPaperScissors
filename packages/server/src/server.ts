import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { RoomManager } from './rooms/RoomManager.js';
import { analytics } from './analytics/AnalyticsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Path to client dist (in production or unified docker container)
const CLIENT_DIST_PATH = path.resolve(__dirname, '../../client/dist');

const roomManager = new RoomManager();

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // CORS headers for APIs
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // Health check endpoint
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        rooms: roomManager.getActiveRoomCount(),
        players: roomManager.getTotalPlayerCount(),
      })
    );
    return;
  }

  // Server diagnostics / metrics
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        uptime: Math.floor(process.uptime()),
        rooms: roomManager.getActiveRoomCount(),
        players: roomManager.getTotalPlayerCount(),
        memoryUsage: process.memoryUsage(),
        analytics: analytics.getSummary(),
      })
    );
    return;
  }

  // Analytics ingestion
  if (url.pathname === '/api/analytics/events' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        analytics.trackEvent(parsed.name, parsed.payload);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Static file serving for single-container Home PC deployment
  if (fs.existsSync(CLIENT_DIST_PATH)) {
    let filePath = path.join(CLIENT_DIST_PATH, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      // SPA Fallback
      filePath = path.join(CLIENT_DIST_PATH, 'index.html');
    }

    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Default fallback if client dist is not built yet
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Rock Paper Scissors Boom Game Server is running. Client frontend is being served separately or building.');
});

// Attach WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  roomManager.handleConnection(ws);
});

server.listen(PORT, HOST, () => {
  console.log(`[RPS-BOOM] Game server listening on http://${HOST}:${PORT}`);
  console.log(`[RPS-BOOM] WebSocket endpoint ready at ws://${HOST}:${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('[RPS-BOOM] Shutting down gracefully...');
  wss.close();
  roomManager.shutdown();
  server.close(() => {
    console.log('[RPS-BOOM] Server closed successfully.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
