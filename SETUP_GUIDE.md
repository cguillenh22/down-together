# Phase 6.2: Setup & Integration Testing Guide

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Git

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment
cp .env.example .env

# Configure .env
# - DATABASE_URL (local PostgreSQL)
# - JWT_SECRET (generate: openssl rand -hex 32)
# - SMTP settings (optional, can use dummy for testing)

# Run migrations
npx prisma migrate deploy

# Start server
npm run dev
# Server: http://localhost:3000
# WebSocket: ws://localhost:3000
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Copy environment
cp .env.example.frontend .env.local

# Configure .env.local
PUBLIC_API_URL=http://localhost:3000
PUBLIC_WEBSOCKET_URL=ws://localhost:3000
PUBLIC_ENV=development
PUBLIC_ENABLE_NOTIFICATIONS=true

# Start dev server
npm run dev
# Frontend: http://localhost:3001 (or port shown)
```

### 3. Verify Connection

```bash
# Test backend health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2026-07-31T..."}
```

---

## 🧪 Integration Testing Checklist

### Authentication Flow
- [ ] User registration works
- [ ] Email verification link works
- [ ] Login successful
- [ ] Tokens stored in localStorage
- [ ] Logout clears tokens
- [ ] Token refresh on 401
- [ ] Redirect to login on unauthorized

### Comments System
- [ ] Create comment works
- [ ] Comment shows "pending" status
- [ ] Get pending comments (moderator)
- [ ] Approve comment shows real-time notification
- [ ] Like comment increments count
- [ ] Delete comment removes it
- [ ] Comment thread (replies) works

### Bookmarks
- [ ] Add bookmark works
- [ ] Bookmark appears in list
- [ ] Remove bookmark works
- [ ] Duplicate bookmark prevented (409)
- [ ] Sync on login works (localStorage → backend)
- [ ] IsBookmarked check works

### Expert Q&A
- [ ] Can't create Q&A as member (403)
- [ ] Request expert verification works
- [ ] Admin approves verification
- [ ] Expert can now create Q&A
- [ ] Q&A starts as draft
- [ ] Publish Q&A works
- [ ] Mark helpful increments count
- [ ] View count increments

### Notifications
- [ ] Subscribe to newsletter works
- [ ] Get notifications (authenticated)
- [ ] Mark notification read works
- [ ] Delete notification works
- [ ] WebSocket connects
- [ ] Real-time notifications received
- [ ] Browser Notification API works

---

## 📝 Testing Scripts

### Register & Login Test

```bash
# Register new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "name":"Test User",
    "password":"TestPass123!"
  }'

# Expected: user created, tokens returned

# Login with credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!"
  }'

# Expected: tokens returned
# Save access_token
TOKEN="eyJhbGc..."
```

### Comment Test

```bash
# Create comment
curl -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id":"health-101",
    "content":"Great article!"
  }'

# Expected: comment with status=pending

# Get approved comments
curl http://localhost:3000/api/comments/article/health-101

# Expected: empty (comment still pending)

# Get pending (as moderator)
curl http://localhost:3000/api/moderation/pending \
  -H "Authorization: Bearer $MODERATOR_TOKEN"

# Expected: pending comment in list

# Approve comment
curl -X POST http://localhost:3000/api/comments/COMMENT_ID/moderate \
  -H "Authorization: Bearer $MODERATOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"approved"}'

# Check real-time notification received
```

### Bookmark Test

```bash
# Add bookmark
curl -X POST http://localhost:3000/api/bookmarks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "article_id":"health-101",
    "article_title":"Health Basics",
    "article_url":"https://example.com/health-101"
  }'

# Expected: bookmark created

# Get bookmarks
curl http://localhost:3000/api/bookmarks/user \
  -H "Authorization: Bearer $TOKEN"

# Expected: bookmark in list

# Sync bookmarks (login scenario)
curl -X POST http://localhost:3000/api/bookmarks/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookmarks":[
      {
        "article_id":"education-101",
        "article_title":"Education Guide",
        "article_url":"https://example.com/education-101"
      }
    ]
  }'

# Expected: synced bookmarks
```

---

## 🌐 WebSocket Testing

### Connect WebSocket

```bash
# Using websocat (install: brew install websocat)
websocat "ws://localhost:3000/ws" -H "Authorization: Bearer $TOKEN"

# Then send notification from backend:
# POST /api/comments/:id/moderate → approve
# You should receive real-time notification
```

---

## 📊 Common Issues & Fixes

### CORS Error
```
Error: Access to XMLHttpRequest from 'http://localhost:3001' blocked by CORS
```
**Fix**: 
- Check `CORS_ORIGIN` in backend .env
- Should match frontend URL: `http://localhost:3001`

### Token Expired
```
Error: 401 Unauthorized
```
**Fix**:
- Backend should auto-refresh on 401
- Check if refresh token in localStorage
- Re-login if needed

### Database Connection
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Fix**:
- Start PostgreSQL: `brew services start postgresql`
- Check DATABASE_URL is correct
- Run migrations: `npx prisma migrate deploy`

### WebSocket Connection
```
Error: WebSocket connection failed
```
**Fix**:
- Backend WebSocket must be enabled
- Check port 3000 is accessible
- Verify token is included in headers

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] TypeScript compiles
- [ ] Environment variables configured
- [ ] Database backups ready

### Staging
- [ ] Deploy backend to staging
- [ ] Deploy frontend to staging
- [ ] Run smoke tests
- [ ] Test end-to-end workflows
- [ ] Monitor error rates
- [ ] Check performance metrics

### Production
- [ ] Backend deployed to production
- [ ] Frontend deployed to production
- [ ] DNS configured
- [ ] SSL certificates valid
- [ ] Monitoring enabled
- [ ] Alerting configured
- [ ] Backups verified

---

## 📞 Troubleshooting

### Check Backend Health
```bash
curl http://localhost:3000/health
```

### Check Frontend Build
```bash
npm run build
# Check for errors in output
```

### View Backend Logs
```bash
cd backend && npm run dev
# Watch for errors in console
```

### View Frontend Logs
```bash
npm run dev
# Check browser console (F12)
```

---

## ✨ Ready to Test!

Start both servers and begin integration testing. Report any issues found in GitHub issues.

**Timeline**: 1-3 days for full integration testing
**Target**: Zero errors, all workflows passing
**Next**: Staging deployment
