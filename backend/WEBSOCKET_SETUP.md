# WebSocket Setup Guide

## Overview

Real-time notifications via Socket.io. Already configured in `src/server.ts`.

## Current Implementation

```typescript
// src/server.ts
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);

  const token = socket.handshake.auth.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  socket.data.userId = token;

  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
  });
});
```

## Enabling Real-time Features

### 1. Complete Token Verification

```typescript
// src/server.ts
import { verifyRefreshToken } from './middleware/auth';

io.on('connection', (socket) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    socket.disconnect();
    return;
  }

  // Verify JWT and extract user ID
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { id: string };
    socket.data.userId = decoded.id;
    socket.join(`user:${decoded.id}`); // Room per user
  } catch {
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.data.userId);
  });
});
```

### 2. Send Notifications from Controllers

When approving comments, publishing Q&A, expert verification:

```typescript
// In any controller
const io = (global as any).io;
if (io) {
  io.to(`user:${userId}`).emit('notification', {
    type: 'comment_approved',
    title: 'Your comment was approved',
    message: '...',
  });
}
```

### 3. Client-side Setup

Frontend already has `notificationService`:

```typescript
// Frontend: src/lib/notifications.service.ts
connectWebSocket(): void {
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  this.websocket = new WebSocket(wsUrl);
  
  this.websocket.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    this.notifications.set(notification.id, notification);
    this.notifyObservers();
  };
}
```

## Testing WebSocket

### 1. With curl (socket.io client)

```bash
# Install socket.io-client globally
npm install -g socket.io-client

# Test connection
const io = require('socket.io-client');
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('notification', (data) => {
  console.log('Received:', data);
});
```

### 2. With Node.js test script

```typescript
// test-websocket.ts
import io from 'socket.io-client';

const token = 'your-jwt-token-here';
const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('notification', (data) => {
  console.log('Notification received:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Keep alive
setTimeout(() => socket.disconnect(), 30000);
```

## Broadcasting Scenarios

### Comment Approved
```typescript
// src/controllers/comments.ts
if (newStatus === 'approved') {
  const io = (global as any).io;
  if (io) {
    io.to(`user:${comment.userId}`).emit('notification', {
      type: 'comment_approved',
      title: 'Your comment was approved! ✨',
      message: `"${comment.content.substring(0, 100)}..."`,
      link: `/articles/${comment.articleId}#comment-${comment.id}`,
    });
  }
}
```

### Q&A Published
```typescript
// src/controllers/qa.ts
if (parsed.data.published) {
  const io = (global as any).io;
  if (io) {
    io.emit('new_qa', {
      id: updated.id,
      question: updated.question,
      category: updated.category,
      expert_name: expert.name,
    });
  }
}
```

### Expert Verified
```typescript
// src/controllers/expert.ts
const io = (global as any).io;
if (io) {
  io.to(`user:${verification.userId}`).emit('notification', {
    type: 'expert_verified',
    title: 'Your expert verification is approved! 🎉',
    message: 'You can now submit expert Q&A',
  });
}
```

## Deployment Considerations

### Single Server
Current setup works fine for development and small deployments.

### Multiple Servers (Horizontal Scaling)
Use Redis adapter:

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient();
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});
```

### Environment Variables
```env
# For Redis adapter
REDIS_URL=redis://localhost:6379
```

## Monitoring

### Track Connected Users
```typescript
io.on('connection', (socket) => {
  const activeConnections = io.engine.clientsCount;
  console.log(`Active connections: ${activeConnections}`);
});
```

### Track Message Volume
```typescript
let messageCount = 0;
setInterval(() => {
  console.log(`Messages sent in last 10s: ${messageCount}`);
  messageCount = 0;
}, 10000);

io.to(room).emit('notification', (data) => {
  messageCount++;
  // ...
});
```

## Next Steps

1. ✅ WebSocket server configured in `src/server.ts`
2. ✅ Controllers ready to emit notifications (already have `io` setup)
3. ⏳ Test with real token + browsers
4. ⏳ Deploy to staging
5. ⏳ Monitor connections in production

## Troubleshooting

### WebSocket connection refused
- Check `CORS_ORIGIN` env var matches frontend URL
- Verify port is open (3000 or specified PORT)
- Check firewall/proxy doesn't block WebSocket

### Messages not received
- Verify token is correct JWT
- Check browser console for WebSocket errors
- Use browser DevTools → Network → WS to inspect frames

### High latency
- Monitor server load
- Check Redis connection if using adapter
- Reduce message frequency if needed

### Memory leaks
- Ensure handlers are properly removed on disconnect
- Monitor socket count over time: `io.engine.clientsCount`
- Add memory profiling in production

## Example: Full Flow

1. **Frontend**: User approves comment via dashboard
   ```
   POST /api/comments/:id/moderate → approve
   ```

2. **Backend**: Comment status updated
   ```typescript
   await prisma.comment.update({ status: 'approved' })
   
   // Send real-time notification
   io.to(`user:${comment.userId}`).emit('notification', { ... })
   ```

3. **Frontend**: WebSocket message received
   ```typescript
   socket.on('notification', (data) => {
     addNotification(data);
     showBrowserNotification(data);
   });
   ```

4. **User**: Toast notification appears with link to article
   ```
   "Your comment was approved ✨"
   → Click → Scroll to comment
   ```

All done! ✅
