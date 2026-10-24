import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { Player, WorldState, Appearance, WSMessage, Direction } from './src/types.js';
import { generateChunk } from './src/procedural.js';
import { resolveMovement } from './src/collision.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

// Server World State
const WORLD_STATE: WorldState = {
  seed: 98765,
  timeOfDay: 12.0, // 0 to 24
  isNight: false
};

const serverChunksMap = new Map<string, any>();
function getServerChunk(cx: number, cy: number) {
  const key = `${cx}:${cy}`;
  let chunk = serverChunksMap.get(key);
  if (!chunk) {
    chunk = generateChunk(WORLD_STATE.seed, cx, cy);
    serverChunksMap.set(key, chunk);
  }
  return chunk;
}

// Advance Day/Night Cycle (1 in-game day = 6 real minutes)
setInterval(() => {
  WORLD_STATE.timeOfDay = (WORLD_STATE.timeOfDay + 0.05) % 24;
  WORLD_STATE.isNight = WORLD_STATE.timeOfDay < 6 || WORLD_STATE.timeOfDay > 19;
}, 750);

interface UserSession {
  selfId: string;
  name: string;
  appearance: Appearance;
}

const sessions = new Map<string, UserSession>();
const playersMap = new Map<string, Player>();
const playerInputs = new Map<string, { dx: number; dy: number; dir?: Direction }>();
const activeSockets = new Map<string, WebSocket>();

function getOrCreateSession(req: express.Request, res: express.Response): UserSession {
  let sessionId = req.cookies.pusheen_session;
  if (!sessionId || !sessions.has(sessionId)) {
    const num = Math.floor(1000 + Math.random() * 9000);
    sessionId = `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const session: UserSession = {
      selfId: sessionId,
      name: `Котик #${num}`,
      appearance: { fur: 'gray', accessory: 'none' }
    };
    sessions.set(sessionId, session);
    res.cookie('pusheen_session', sessionId, { httpOnly: true, maxAge: 30 * 24 * 3600 * 1000 });
    return session;
  }
  return sessions.get(sessionId)!;
}

// REST APIs
app.get('/api/bootstrap', (req, res) => {
  const session = getOrCreateSession(req, res);
  res.json({
    selfId: session.selfId,
    profile: {
      name: session.name,
      appearance: session.appearance
    },
    worldState: WORLD_STATE
  });
});

app.post('/api/profile', (req, res) => {
  const session = getOrCreateSession(req, res);
  const { name, appearance } = req.body;

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 20) {
    return res.status(400).json({ error: 'Некорректное имя котика' });
  }

  const cleanName = name.trim();
  session.name = cleanName;
  if (appearance && typeof appearance === 'object') {
    session.appearance = {
      fur: ['gray', 'lavender', 'cream', 'cocoa'].includes(appearance.fur) ? appearance.fur : 'gray',
      accessory: ['none', 'mushroom-hat', 'hat', 'pink-body-bow', 'blue-tail-bow'].includes(appearance.accessory)
        ? appearance.accessory
        : 'none'
    };
  }

  const p = playersMap.get(session.selfId);
  if (p) {
    p.name = session.name;
    p.appearance = session.appearance;
  }

  res.json({ success: true, profile: { name: session.name, appearance: session.appearance } });
});

// WebSocket Setup
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  try {
    const host = request.headers.host || 'localhost';
    const pathname = new URL(request.url || '', `http://${host}`).pathname;
    if (pathname === '/ws' || pathname.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
      });
      return;
    }
  } catch (err) {
    console.error('Upgrade error:', err);
  }
  // Allow Vite or other handlers to process non-/ws upgrade requests
});

function parseCookies(request: http.IncomingMessage): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });
  return list;
}

wss.on('connection', (ws, request) => {
  const cookies = parseCookies(request);
  let sessionId = cookies.pusheen_session;
  let session = sessionId ? sessions.get(sessionId) : null;

  if (!session) {
    const num = Math.floor(1000 + Math.random() * 9000);
    sessionId = `cat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    session = {
      selfId: sessionId,
      name: `Котик #${num}`,
      appearance: { fur: 'gray', accessory: 'none' }
    };
    sessions.set(sessionId, session);
  }

  const id = session.selfId;
  activeSockets.set(id, ws);

  if (!playersMap.has(id)) {
    const player: Player = {
      id,
      name: session.name,
      x: 128 + (Math.random() * 40 - 20),
      y: 128 + (Math.random() * 40 - 20),
      dir: 'down',
      moving: false,
      pose: 'idle',
      appearance: { ...session.appearance }
    };
    playersMap.set(id, player);
  } else {
    const existing = playersMap.get(id)!;
    existing.name = session.name;
    existing.appearance = { ...session.appearance };
  }

  const welcomeMsg: WSMessage = {
    type: 'welcome',
    selfId: id,
    players: Array.from(playersMap.values()),
    worldState: WORLD_STATE
  };
  ws.send(JSON.stringify(welcomeMsg));

  ws.on('message', data => {
    try {
      const msg: WSMessage = JSON.parse(data.toString());
      const player = playersMap.get(id);
      if (!player) return;

      if (msg.type === 'input') {
        const dx = typeof msg.dx === 'number' ? Math.max(-1, Math.min(1, msg.dx)) : 0;
        const dy = typeof msg.dy === 'number' ? Math.max(-1, Math.min(1, msg.dy)) : 0;
        const dir = ['down', 'up', 'left', 'right'].includes(msg.dir || '') ? msg.dir : undefined;
        playerInputs.set(id, { dx, dy, dir });
      }

      if (msg.type === 'chat' && typeof msg.text === 'string' && msg.text.trim()) {
        const text = msg.text.trim().slice(0, 120);
        player.message = { text, until: Date.now() + 6000 };

        const chatBroadcast: WSMessage = {
          type: 'chat',
          name: player.name,
          text
        };
        const payload = JSON.stringify(chatBroadcast);
        for (const client of activeSockets.values()) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      }

      if (msg.type === 'pose' && msg.pose && ['idle', 'walk', 'sleep', 'sit'].includes(msg.pose)) {
        player.pose = msg.pose;
      }

      if (msg.type === 'emote' && msg.kind && ['heart', 'wave', 'happy'].includes(msg.kind)) {
        player.emote = { kind: msg.kind, until: Date.now() + 3000 };
      }

      if (msg.type === 'interact') {
        player.pose = player.pose === 'sit' ? 'idle' : 'sit';
      }

      if (msg.type === 'profile' && msg.name && msg.appearance) {
        if (msg.name.trim().length >= 2 && msg.name.trim().length <= 20) {
          player.name = msg.name.trim();
          session.name = player.name;
        }
        if (msg.appearance) {
          player.appearance = {
            fur: ['gray', 'lavender', 'cream', 'cocoa'].includes(msg.appearance.fur) ? msg.appearance.fur : 'gray',
            accessory: ['none', 'mushroom-hat', 'hat', 'pink-body-bow', 'blue-tail-bow'].includes(msg.appearance.accessory)
              ? msg.appearance.accessory
              : 'none'
          };
          session.appearance = { ...player.appearance };
        }
      }
    } catch {
      // Ignore invalid JSON
    }
  });

  ws.on('close', () => {
    activeSockets.delete(id);
    playerInputs.delete(id);
    setTimeout(() => {
      if (!activeSockets.has(id)) {
        playersMap.delete(id);
      }
    }, 60000);
  });
});

// Server Physics & Broadcast Loop (20Hz = 50ms)
const SPEED = 3.5;

setInterval(() => {
  for (const [id, player] of playersMap.entries()) {
    const input = playerInputs.get(id) || { dx: 0, dy: 0 };
    if (input.dx !== 0 || input.dy !== 0) {
      const nextPos = resolveMovement(player.x, player.y, input.dx, input.dy, SPEED, getServerChunk);
      player.x = nextPos.x;
      player.y = nextPos.y;
      player.moving = true;
      player.pose = 'walk';

      if (input.dir) {
        player.dir = input.dir;
      } else if (Math.abs(input.dx) > Math.abs(input.dy)) {
        player.dir = input.dx > 0 ? 'right' : 'left';
      } else {
        player.dir = input.dy > 0 ? 'down' : 'up';
      }
    } else {
      player.moving = false;
      if (player.pose === 'walk') {
        player.pose = 'idle';
      }
    }
  }

  // Broadcast state snapshot to all connected sockets
  if (activeSockets.size > 0) {
    const snapshotMsg: WSMessage = {
      type: 'state',
      players: Array.from(playersMap.values()),
      worldState: WORLD_STATE
    };
    const payload = JSON.stringify(snapshotMsg);
    for (const client of activeSockets.values()) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}, 50);

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await vite.transformIndexHtml(url, fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8'));
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
