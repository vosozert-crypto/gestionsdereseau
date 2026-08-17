import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/index.js';
import { getDb, closeDb } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import authRoutes from './routes/auth.js';
import deviceRoutes from './routes/devices.js';
import logRoutes from './routes/logs.js';
import dashboardRoutes from './routes/dashboard.js';
import portRoutes from './routes/ports.js';
import scanRoutes from './routes/scan.js';
import diagnosticsRoutes from './routes/diagnostics.js';
import { authenticateToken, AuthRequest } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

const isProduction = config.nodeEnv === 'production';

const allowedOrigins = isProduction
  ? [
      `https://${config.host}`,
      `http://${config.host}`,
      ...(process.env.RAILWAY_PUBLIC_DOMAIN ? [`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`] : []),
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ]
  : ['http://localhost:3000', 'http://localhost:5173'];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(helmet({
  contentSecurityPolicy: isProduction ? false : undefined,
}));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '5.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ports', portRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/diagnostics', diagnosticsRoutes);

if (isProduction) {
  const frontendPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(frontendPath, {
    maxAge: '30d',
    etag: true,
    lastModified: true,
  }));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    next(new Error('Authentication required'));
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${(socket as any).user?.username}`);

  socket.on('subscribe:metrics', () => {
    socket.join('metrics');
  });

  socket.on('subscribe:devices', () => {
    socket.join('devices');
  });

  socket.on('subscribe:logs', () => {
    socket.join('logs');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${(socket as any).user?.username}`);
  });
});

function startMetricsBroadcaster(): void {
  setInterval(() => {
    try {
      const db = getDb();
      const devices = db.prepare(
        "SELECT id, status, latency_ms FROM devices WHERE status = 'online'"
      ).all() as { id: string; status: string; latency_ms: number }[];

      const metrics = {
        timestamp: new Date().toISOString(),
        onlineCount: devices.length,
        avgLatency: devices.length > 0
          ? Math.round((devices.reduce((s, d) => s + d.latency_ms, 0) / devices.length) * 10) / 10
          : 0,
        systemLoad: {
          cpu: Math.round(10 + Math.random() * 15),
          memory: Math.round(40 + Math.random() * 20),
        },
      };

      io.to('metrics').emit('metrics:live', metrics);
    } catch (err) {
      console.error('Metrics broadcast error:', err);
    }
  }, 5000);
}

const PORT = config.port;
const HOST = config.host;

getDb();
seedDatabase();
console.log(`Database initialized & seeded (${isProduction ? 'production' : 'development'} mode)`);

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`NetManager Pro API running on http://0.0.0.0:${PORT}`);
  if (!isProduction) {
    console.log(`Frontend dev server: http://localhost:3000`);
  }
  startMetricsBroadcaster();
});

process.on('SIGINT', () => {
  console.log('Shutting down...');
  io.close();
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  io.close();
  closeDb();
  process.exit(0);
});
