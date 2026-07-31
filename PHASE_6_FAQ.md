# Phase 6 Backend Implementation FAQ

## Authentication & Security

### Q: How should I store refresh tokens?
**A**: 
- Access tokens: JWT in memory (expires 1 hour)
- Refresh tokens: In database + httpOnly cookie
- Reason: Refresh tokens live longer (7 days), so database lookup ensures revocation on logout works

```typescript
// After login, also store in DB:
await db.refreshTokens.create({
  token: refresh_token,
  user_id: user.id,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

// On refresh endpoint:
const storedToken = await db.refreshTokens.findUnique({ where: { token } });
if (!storedToken || storedToken.expires_at < new Date()) {
  throw new Error('Token expired or invalid');
}
```

### Q: Should I hash passwords with bcrypt or Argon2?
**A**: Either is fine. Bcrypt is simpler and battle-tested:
- Cost factor: 12 (takes ~100ms to hash)
- Higher cost = slower brute force, but don't go over 13 (too slow for login)

### Q: How do I handle OAuth (Google, GitHub)?
**A**: For MVP, implement basic structure:
1. Store OAuth provider ID on user (google_id, github_id)
2. Redirect to provider during login
3. Exchange code for token
4. Look up user by provider_id
5. If not found, create new user with email from provider

```typescript
async function handleOAuthCallback(code: string, provider: 'google' | 'github') {
  const { email, id, name } = await exchangeCodeForProfile(code, provider);
  
  let user = await db.users.findUnique({
    where: { [`${provider}_id`]: id }
  });

  if (!user) {
    user = await db.users.create({
      data: {
        email,
        name,
        [`${provider}_id`]: id,
        role: 'member',
      }
    });
  }

  // Generate tokens...
}
```

### Q: How do I prevent brute force attacks on login?
**A**: Implement rate limiting + progressive delays:

```typescript
// Track failed attempts
const key = `login_attempts:${email}`;
const attempts = await redis.get(key) || 0;

if (attempts >= 5) {
  const delay = Math.pow(2, Math.min(attempts - 5, 4)); // Exponential backoff
  return res.status(429).json({ 
    error: 'Too many attempts', 
    retry_after: delay 
  });
}

if (!valid_password) {
  await redis.setex(key, 3600, attempts + 1); // Reset after 1 hour
  return res.status(401).json({ error: 'Invalid credentials' });
} else {
  await redis.del(key); // Clear on successful login
}
```

---

## Comments & Moderation

### Q: Should I auto-approve comments or require moderation?
**A**: Require moderation initially:
- Status: "pending" on creation
- Moderator dashboard for approval
- Auto-approve after expert verification (later phase)
- Reason: Prevent spam during launch

### Q: How do I handle comment threads (replies)?
**A**: Use parent_comment_id:

```typescript
// Get comment + all replies
const comment = await db.comments.findUnique({
  where: { id: commentId },
  include: {
    replies: {
      where: { status: 'approved' },
      orderBy: { created_at: 'asc' },
    }
  }
});

// API response structure:
{
  id: "...",
  content: "...",
  replies: [
    { id: "...", content: "...", parent_comment_id: "..." }
  ]
}
```

### Q: How do I prevent spam comments?
**A**: Layered approach:
1. Rate limit: 10 comments per user per hour
2. Content check: Flag if >50% links or all caps
3. Require moderation for first 5 comments per user
4. Allow community flagging → auto-hide after 3 flags

```typescript
async function flagComment(commentId: string, reason: string) {
  const flags = await db.flaggedComments.count({
    where: { comment_id: commentId }
  });

  if (flags >= 3) {
    await db.comments.update({
      where: { id: commentId },
      data: { status: 'spam' }
    });
    
    // Notify moderator
    await notificationService.send(MODERATOR_ID, {
      type: 'spam_detected',
      title: 'Comment auto-hidden for spam',
      link: `/moderation/comments/${commentId}`
    });
  }
}
```

### Q: Should comments have edit/delete history?
**A**: For MVP, simple approach:
- Users can delete own comments (logical delete)
- Users can edit own comments (update with edited_at timestamp)
- Moderators can see edit history via audit table

```typescript
// Track edits in separate table
const editHistory = await db.commentEdits.create({
  data: {
    comment_id: commentId,
    old_content: oldComment.content,
    new_content: newContent,
    edited_by: user.id,
    created_at: new Date(),
  }
});
```

---

## Bookmarks & Personalization

### Q: How do I prevent duplicate bookmarks?
**A**: Database constraint (unique index already in schema):

```sql
UNIQUE(user_id, article_id)
```

This means attempt to add same bookmark twice returns 409 Conflict. Handle on frontend:

```typescript
if (error.code === 'P2002') { // Prisma duplicate key error
  return res.status(409).json({ error: 'Already bookmarked' });
}
```

### Q: Should bookmarks have collections/folders?
**A**: For MVP, no. Keep it flat. Add folders in Phase 7:
- Table: bookmark_collections
- Foreign key: collection_id on bookmarks
- Feature: "My Saved", "Top Picks", "Learning Path"

### Q: How do I handle bookmark sync when user logs in?
**A**: Merge strategy (frontend handles this):
```typescript
// Frontend calls after login
await bookmarkService.syncLocalBookmarks();

// Backend endpoint: POST /api/bookmarks/sync
// Accept array of article_ids, create missing ones
router.post('/bookmarks/sync', requireAuth, async (req, res) => {
  const { article_ids } = req.body;
  
  const existing = await db.bookmarks.findMany({
    where: { user_id: req.user.id }
  });

  const existingIds = new Set(existing.map(b => b.article_id));
  const toCreate = article_ids.filter(id => !existingIds.has(id));

  const created = await db.bookmarks.createMany({
    data: toCreate.map(id => ({
      user_id: req.user.id,
      article_id: id,
      // article_title, article_url from articles table
    }))
  });

  res.json({ synced: created.length });
});
```

---

## Expert Q&A System

### Q: How do I verify experts?
**A**: Request → Admin Review → Badge:

```typescript
// User requests verification
POST /api/expert/verify
{
  credentials: "MD from Stanford, 10 years experience",
  specialty: "Pediatric Down Syndrome",
  years_experience: 10,
  bio: "..."
}

// Creates record with status="pending"
// Admin dashboard shows pending requests
// Admin clicks approve → status="approved", expert_verified=true

// On expert profile, show verified badge via:
SELECT * FROM users WHERE id = ? AND verified = true;
```

### Q: Should experts be able to edit their Q&A?
**A**: Yes, with audit trail:

```typescript
// Keep original answer in DB
// On edit: create new entry with version number
// Show "updated X days ago" on frontend

PATCH /api/qa/:qaId
{
  answer: "Updated answer...",
  updated_at: new Date()
}

// Track in audit table
await db.qaEdits.create({
  qa_id: qaId,
  old_answer: original.answer,
  new_answer: body.answer,
  edited_by: req.user.id
});
```

### Q: How do I rank Q&A by quality?
**A**: Multi-factor score:

```typescript
// Ranking score = (helpful_count * 2) + (views * 0.1) - (hours_old * 0.01)
const score = (qa.helpful_count * 2) + (qa.views_count * 0.1) - 
              ((new Date() - qa.created_at) / 3600000) * 0.01;

// GET /api/qa?sort=score (default)
// GET /api/qa?sort=recent (by created_at)
// GET /api/qa?sort=helpful (by helpful_count)
```

---

## Notifications & Real-time

### Q: Should I use WebSocket or polling?
**A**: WebSocket for real-time (implemented):
- Connection established after user authenticates
- Server sends notification to specific user immediately
- Client receives within milliseconds
- Great for: new comments, expert answers, moderation actions

Polling is simpler to start with (fallback):
```typescript
// Client polls every 30 seconds
setInterval(async () => {
  const newNotifs = await fetch('/api/notifications?since=lastCheck');
  displayNotifications(newNotifs);
}, 30000);
```

For MVP, use polling if WebSocket is too complex. Add WebSocket in Phase 6.2.

### Q: How do I handle offline users with notifications?
**A**: Store in database + email:

```typescript
// Always create notification in DB
await db.notifications.create({ ... });

// If user is online (in activeConnections set), send via WebSocket
const ws = activeConnections.get(userId);
if (ws) {
  ws.send(JSON.stringify(notification));
} else {
  // User offline: send email
  if (user.email_subscribed) {
    await emailService.send(user.email, {
      subject: notification.title,
      body: notification.message
    });
  }
}
```

### Q: How do I manage WebSocket memory with many users?
**A**: Use Redis for multi-server setup:

```typescript
// Instead of Map<userId, WebSocket>
// Publish/subscribe across servers
io.on('connection', (socket) => {
  socket.join(`user:${userId}`); // Room per user
});

// When sending notification
io.to(`user:${userId}`).emit('notification', notification);

// This works across multiple server instances via Redis
```

---

## Email & Newsletter

### Q: How do I handle email verification?
**A**: Token-based link:

```typescript
// After registration, generate token
const verifyToken = crypto.randomBytes(32).toString('hex');
await db.emailVerifications.create({
  user_id: user.id,
  token: verifyToken,
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000)
});

// Send email with link
const verifyLink = `https://downtogether.org/verify-email?token=${verifyToken}`;
await emailService.send(user.email, {
  subject: 'Verify your Down Together account',
  body: `Click here to verify: ${verifyLink}`
});

// POST /api/auth/verify-email?token=...
router.post('/auth/verify-email', async (req, res) => {
  const { token } = req.query;
  const verification = await db.emailVerifications.findUnique({ where: { token } });
  
  if (!verification || verification.expires_at < new Date()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  await db.users.update({
    where: { id: verification.user_id },
    data: { email_verified: true }
  });

  res.json({ success: true });
});
```

### Q: How often should I send newsletters?
**A**: Start with weekly (every Monday):

```typescript
// Scheduled job (cron)
// Every Monday at 9 AM
0 9 * * 1 node scripts/send-newsletter.js

// Get top articles from past week
const topArticles = await db.articles.findMany({
  where: { created_at: { gte: lastMonday } },
  orderBy: { views: 'desc' },
  take: 5
});

// Send to subscribers
const subscribers = await db.emailSubscriptions.findMany({
  where: { subscribed: true }
});

for (const subscriber of subscribers) {
  await emailService.send(subscriber.email, {
    subject: 'Down Together Weekly - 5 Best Articles',
    body: buildNewsletterHtml(topArticles)
  });
}
```

---

## Performance & Scaling

### Q: What database indexes do I need?
**A**: Already included in schema, but key ones:
```sql
-- Comments (most queries)
CREATE INDEX idx_comments_article ON comments(article_id, status);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Bookmarks (user's bookmarks page)
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- Notifications (notification bell)
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Activities (analytics)
CREATE INDEX idx_activity_user_type ON user_activity(user_id, activity_type);
```

### Q: How do I cache approved comments?
**A**: Redis with TTL:

```typescript
const cacheKey = `comments:article:${articleId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return res.json(JSON.parse(cached));
}

const comments = await db.comments.findMany({
  where: { article_id: articleId, status: 'approved' }
});

// Cache for 5 minutes
await redis.setex(cacheKey, 300, JSON.stringify(comments));
res.json(comments);

// Invalidate cache when comment status changes
await redis.del(cacheKey);
```

### Q: At what point do I need to shard data?
**A**: When you reach:
- **Comments table**: >50 million rows
- **Solution**: Shard by article_id (comments for health_101 go to shard 1, etc.)

For MVP, don't worry about this. Full text search (Elasticsearch) is a Phase 7 optimization.

---

## Testing & Monitoring

### Q: What should I test?
**A**: Priority order:
1. Auth flow (register → login → token refresh → logout)
2. Comment creation → moderation → approval flow
3. Bookmark sync (add local → login → check backend)
4. Expert verification → badge appears
5. WebSocket notifications → real-time delivery

### Q: How do I monitor in production?
**A**: Essential metrics:
```typescript
// Track these
- API response times (per endpoint)
- Error rates (500s, 401s, 409s)
- Database query times (slow queries log)
- WebSocket connection count
- Comment moderation queue size
- Newsletter delivery success rate
```

Example monitoring code:
```typescript
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordApiCall(req.method, req.path, res.statusCode, duration);
  });
  next();
});
```

---

## Troubleshooting

### Q: Comments show "pending" and never get approved
**A**: Check:
1. Is moderator role assigned to admin user?
2. Is moderation dashboard sending PATCH request to correct endpoint?
3. Check database: `SELECT status FROM comments WHERE status = 'pending'`

### Q: WebSocket disconnects frequently
**A**:
1. Add ping/pong keepalive: `socket.emit('ping')` every 30s
2. Increase server timeout: `io.set('transports', ['websocket', 'polling'])`
3. Check cloud firewall isn't blocking WebSocket port

### Q: Newsletter emails not sending
**A**:
1. Verify SMTP credentials in environment
2. Check email_subscribed flag is true
3. Look at email service logs for bounces
4. Sender email whitelisted in email provider?

### Q: Bookmarks not syncing on login
**A**:
1. Check syncLocalBookmarks() is called after successful login
2. Verify user.id is consistent (not changing on token refresh)
3. Check database for duplicate prevention error (409)

---

## Configuration Variables

```env
# JWT
JWT_SECRET=<very-long-random-string>
JWT_REFRESH_SECRET=<different-long-random-string>
JWT_EXPIRES_IN=3600 # 1 hour

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/downtogether

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@downtogether.org
SMTP_PASS=<app-password>
SENDER_EMAIL=Down Together <noreply@downtogether.org>

# WebSocket
WEBSOCKET_PORT=3001
CORS_ORIGIN=https://downtogether.org

# Redis (optional, for caching)
REDIS_URL=redis://localhost:6379

# Monitoring
SENTRY_DSN=<sentry-project-url>
LOG_LEVEL=info
```

---

## Phase 6 Backend: Ready to Build

All information provided. Follow the implementation guide and you're good to go!

Questions? Check:
1. `PHASE_6_ARCHITECTURE.md` (why)
2. `API_IMPLEMENTATION_GUIDE.md` (how)
3. This FAQ (troubleshooting)
