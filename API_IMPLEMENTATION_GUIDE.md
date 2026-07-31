# Phase 6 API Implementation Guide

## Quick Reference: API Endpoints

### Authentication Routes
```
POST   /api/auth/login           → AuthResponse
POST   /api/auth/register        → AuthResponse
POST   /api/auth/logout          → { success: boolean }
POST   /api/auth/refresh         → AuthResponse
GET    /api/auth/oauth/:provider → Redirect to OAuth provider
```

### Comment Routes
```
POST   /api/comments                    → CommentResponse
GET    /api/comments/article/:articleId → CommentResponse[]
GET    /api/comments/:commentId         → CommentResponse
PATCH  /api/comments/:commentId         → CommentResponse
DELETE /api/comments/:commentId         → { success: boolean }
POST   /api/comments/:commentId/like    → { likes_count: number }
POST   /api/comments/:commentId/moderate → { success: boolean }
```

### Bookmark Routes
```
POST   /api/bookmarks               → BookmarkResponse
GET    /api/bookmarks/user          → BookmarkResponse[]
GET    /api/bookmarks/:bookmarkId   → BookmarkResponse
DELETE /api/bookmarks/:bookmarkId   → { success: boolean }
```

### Expert Q&A Routes
```
POST   /api/qa                              → ExpertQAResponse
GET    /api/qa                              → ExpertQAResponse[]
GET    /api/qa/:qaId                        → ExpertQAResponse
PATCH  /api/qa/:qaId                        → ExpertQAResponse
GET    /api/qa/expert/:expertId             → ExpertQAResponse[]
POST   /api/qa/:qaId/helpful                → ExpertQAResponse
POST   /api/qa/:qaId/publish                → { success: boolean }
POST   /api/expert/verify                   → ExpertVerificationResponse
GET    /api/expert/verify/requests          → ExpertVerificationResponse[]
POST   /api/expert/verify/:requestId/approve → { success: boolean }
POST   /api/expert/verify/:requestId/reject  → { success: boolean }
```

### Notification Routes
```
GET    /api/notifications              → NotificationResponse[]
POST   /api/notifications/:id/read    → { success: boolean }
DELETE /api/notifications/:id         → { success: boolean }
POST   /api/newsletter/subscribe      → NewsletterSubscribeResponse
POST   /api/newsletter/unsubscribe    → { success: boolean }
```

### WebSocket
```
WS     /ws/notifications  (After authentication via headers)
```

---

## Implementation Pattern (Node.js/Express Example)

### 1. Middleware Setup
```typescript
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'member' | 'expert' | 'moderator' | 'admin';
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
```

### 2. Comment Controller Example
```typescript
import { Router } from 'express';
import { requireAuth } from './middleware';

const router = Router();

// Create comment
router.post('/', requireAuth, async (req: AuthRequest, res) => {
  const { article_id, content, parent_comment_id } = req.body;

  const comment = await db.comments.create({
    article_id,
    user_id: req.user!.id,
    content,
    parent_comment_id,
    status: 'pending', // Requires moderation
    created_at: new Date(),
  });

  res.json(comment);
});

// Get article comments (approved only)
router.get('/article/:articleId', async (req, res) => {
  const comments = await db.comments.findMany({
    where: {
      article_id: req.params.articleId,
      status: 'approved',
    },
    include: { user: { select: { name: true, avatar_url: true } } },
    orderBy: { created_at: 'desc' },
  });

  res.json(comments);
});

// Moderate comment
router.post('/:commentId/moderate', 
  requireAuth, 
  requireRole(['moderator', 'admin']), 
  async (req: AuthRequest, res) => {
    const { action, reason } = req.body;

    const comment = await db.comments.update({
      where: { id: req.params.commentId },
      data: {
        status: action === 'approved' ? 'approved' : 'rejected',
        moderated_at: new Date(),
        moderated_by: req.user!.id,
      },
    });

    // Log moderation
    await db.moderation_log.create({
      comment_id: comment.id,
      moderator_id: req.user!.id,
      action,
      reason,
    });

    // Send notification to comment author
    if (action === 'approved') {
      await notificationService.send(comment.user_id, {
        type: 'comment_approved',
        title: 'Your comment was approved',
        link: `/articles/${comment.article_id}#comment-${comment.id}`,
      });
    }

    res.json({ success: true });
  }
);

export default router;
```

### 3. Authentication Controller
```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;

  // Validate
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Check if user exists
  const existing = await db.users.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 12);

  // Create user
  const user = await db.users.create({
    data: {
      email,
      name,
      password_hash,
      email_verified: false,
      role: 'member',
    },
  });

  // Generate tokens
  const access_token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  const refresh_token = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  // Send verification email
  await emailService.sendVerification(user.email, user.id);

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
    },
    token: {
      access_token,
      refresh_token,
      expires_in: 3600,
      token_type: 'Bearer',
    },
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Update last login
  await db.users.update({
    where: { id: user.id },
    data: { last_login: new Date() },
  });

  // Generate tokens (same as register)
  const access_token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  const refresh_token = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      verified: user.verified,
    },
    token: {
      access_token,
      refresh_token,
      expires_in: 3600,
      token_type: 'Bearer',
    },
  });
});

router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET!);
    const user = await db.users.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const new_access_token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token: {
        access_token: new_access_token,
        refresh_token, // Can stay the same
        expires_in: 3600,
        token_type: 'Bearer',
      },
    });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### 4. Notification Service
```typescript
export class NotificationService {
  async send(userId: string, notification: Partial<NotificationResponse>) {
    const n = await db.notifications.create({
      data: {
        user_id: userId,
        type: notification.type!,
        title: notification.title!,
        message: notification.message,
        link: notification.link,
        created_at: new Date(),
      },
    });

    // Send real-time via WebSocket if user is connected
    this.broadcast(userId, n);

    // Send browser notification if enabled
    if (notification.type !== 'newsletter') {
      // Browser notification sent client-side via service worker
    }

    return n;
  }

  private broadcast(userId: string, notification: NotificationResponse) {
    const ws = this.activeConnections.get(userId);
    if (ws) {
      ws.send(JSON.stringify(notification));
    }
  }
}

// WebSocket setup
io.on('connection', (socket: Socket) => {
  // Authenticate WebSocket connection
  const token = socket.handshake.auth.token;
  const user = authenticateToken(token);

  if (!user) {
    socket.disconnect();
    return;
  }

  // Store connection
  notificationService.activeConnections.set(user.id, socket);

  // Handle disconnect
  socket.on('disconnect', () => {
    notificationService.activeConnections.delete(user.id);
  });
});
```

---

## Rate Limiting & Security

### Rate Limits (Suggested)
```
/api/auth/login              → 5 req/min per IP
/api/comments                → 10 req/min per user
/api/comments/:id/moderate   → 100 req/min per moderator
/api/newsletter/subscribe    → 1 req/min per IP
```

### Input Validation
```typescript
import { z } from 'zod';

const commentSchema = z.object({
  article_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  parent_comment_id: z.string().uuid().optional(),
});

router.post('/comments', async (req, res) => {
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // Process...
});
```

---

## Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Schema imported (`database.schema.sql`)
- [ ] All endpoints implemented
- [ ] JWT secrets configured
- [ ] Email service configured
- [ ] WebSocket server running
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Input validation on all routes
- [ ] Error logging setup (Sentry, DataDog)
- [ ] Database backups configured
- [ ] SSL/TLS certificates setup
- [ ] API documentation generated (Swagger/OpenAPI)

---

## Testing Endpoints

### cURL Examples
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123"}'

# Create comment (authenticated)
curl -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"article_id":"health-101","content":"Great article!"}'

# Get comments
curl http://localhost:3000/api/comments/article/health-101

# Moderate comment
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/moderate \
  -H "Authorization: Bearer MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approved"}'
```

---

## Performance Optimization

### Database Indexing (Already in schema)
- Index on `comments.article_id` (for article comment lists)
- Index on `comments.user_id` (for user comment lists)
- Index on `comments.status` (for moderation queue)
- Index on `bookmarks.user_id` (for user bookmarks)
- Index on `notifications.user_id` (for user notifications)

### Caching Strategy
```typescript
// Cache approved comments for 5 minutes
app.get('/api/comments/article/:articleId', async (req, res) => {
  const cacheKey = `comments:${req.params.articleId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const comments = await db.comments.findMany({
    where: { article_id: req.params.articleId, status: 'approved' },
  });

  await redis.setex(cacheKey, 300, JSON.stringify(comments));
  res.json(comments);
});
```

### Pagination (for large comment lists)
```typescript
const { page = 1, limit = 20 } = req.query;
const skip = (page - 1) * limit;

const comments = await db.comments.findMany({
  where: { article_id: req.params.articleId, status: 'approved' },
  skip,
  take: limit,
  orderBy: { created_at: 'desc' },
});

res.json({
  comments,
  pagination: {
    page,
    limit,
    total: await db.comments.count({ where: { article_id } }),
  },
});
```
