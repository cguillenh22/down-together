import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { validateEnv, env } from './config/env';
import authRoutes from './routes/auth';
import commentsRoutes from './routes/comments';
import bookmarksRoutes from './routes/bookmarks';
import qaRoutes from './routes/qa';
import expertRoutes from './routes/expert';
import notificationsRoutes from './routes/notifications';
import activityRoutes from './routes/activity';

// Validate environment
validateEnv();

// Express app
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/expert', expertRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activity', activityRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// WebSocket setup
io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);

  // Authenticate user
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  // Store user ID on socket
  socket.data.userId = token; // In production, verify JWT

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });
});

// Store IO instance globally for use in controllers
(global as any).io = io;

// Start server
httpServer.listen(env.port, () => {
  console.log(`
╔════════════════════════════════════════════╗
║     Down Together API Server Running       ║
╠════════════════════════════════════════════╣
║ Port: ${env.port}                             ║
║ Environment: ${env.nodeEnv}              ║
║ Frontend: ${env.frontendUrl}    ║
╚════════════════════════════════════════════╝
  `);
});

export { httpServer, io };
