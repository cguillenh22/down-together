# Phase 6 Implementation Checklist

## 📋 Backend Setup (Week 1)

### Infrastructure
- [ ] PostgreSQL database created
- [ ] Schema imported: `psql downtogether < database.schema.sql`
- [ ] Verify all tables created: `\dt` in psql
- [ ] Verify indexes created: `\di` in psql
- [ ] Create PostgreSQL backups (daily)
- [ ] Set up database monitoring/alerts

### Dependencies & Environment
- [ ] Node.js environment setup (v18+)
- [ ] Install: `npm install express jsonwebtoken bcrypt`
- [ ] Install: `npm install @prisma/client` (or use raw queries)
- [ ] Install: `npm install socket.io` (for WebSocket)
- [ ] Install: `npm install nodemailer` (for email)
- [ ] Install: `npm install redis` (for caching, optional)
- [ ] Install: `npm install zod` (for validation)
- [ ] Create `.env` file with all variables
- [ ] Verify environment variables load correctly

### Project Structure
- [ ] Create `/api` folder for routes
- [ ] Create `/controllers` folder for business logic
- [ ] Create `/models` folder for database queries
- [ ] Create `/middleware` folder for auth, validation
- [ ] Create `/services` folder for email, notifications
- [ ] Create `/config` folder for constants, JWT setup
- [ ] Create `/scripts` folder for migrations, seed data

---

## 🔐 Authentication (Week 1: Days 1-2)

### Email/Password Auth
- [ ] Create POST `/api/auth/register` endpoint
  - [ ] Validate email format
  - [ ] Check email not already registered
  - [ ] Hash password with bcrypt (cost: 12)
  - [ ] Create user record with role='member'
  - [ ] Generate JWT access token (1 hour)
  - [ ] Generate JWT refresh token (7 days)
  - [ ] Store refresh token in DB
  - [ ] Send email verification link
  - [ ] Return tokens + user profile
  
- [ ] Create POST `/api/auth/login` endpoint
  - [ ] Find user by email
  - [ ] Compare password hash
  - [ ] Update last_login timestamp
  - [ ] Generate tokens
  - [ ] Return tokens + user profile

- [ ] Create POST `/api/auth/refresh` endpoint
  - [ ] Verify refresh token (signature + expiry)
  - [ ] Check refresh token in DB (not revoked)
  - [ ] Generate new access token
  - [ ] Return new token

- [ ] Create POST `/api/auth/logout` endpoint
  - [ ] Delete refresh token from DB
  - [ ] Return success

- [ ] Create middleware `requireAuth`
  - [ ] Extract token from Authorization header
  - [ ] Verify JWT signature
  - [ ] Check token not expired
  - [ ] Set `req.user` with decoded payload

### Email Verification
- [ ] Create email_verifications table tracking
- [ ] Send verification email on registration
- [ ] Create GET `/api/auth/verify-email?token=...`
  - [ ] Verify token exists and not expired
  - [ ] Mark user.email_verified = true
  - [ ] Delete verification token

### Testing
- [ ] Test register flow (success + duplicate email error)
- [ ] Test login flow (success + invalid password)
- [ ] Test token refresh (success + expired token)
- [ ] Test logout (tokens invalidated)
- [ ] Test email verification link

---

## 💬 Comments System (Week 1: Days 3-5)

### Basic CRUD
- [ ] Create POST `/api/comments` endpoint
  - [ ] Require authentication
  - [ ] Validate article_id, content
  - [ ] Create comment with status='pending'
  - [ ] Increment article comment counter
  - [ ] Return comment response
  
- [ ] Create GET `/api/comments/article/:articleId` endpoint
  - [ ] Filter by status='approved' only
  - [ ] Include user name + avatar
  - [ ] Order by created_at DESC
  - [ ] Support pagination (limit, offset)
  - [ ] Cache response for 5 minutes

- [ ] Create GET `/api/comments/:commentId` endpoint
  - [ ] Return single comment with user info
  - [ ] Include reply count

- [ ] Create PATCH `/api/comments/:commentId` endpoint
  - [ ] Require authentication (owner or admin)
  - [ ] Update content + updated_at
  - [ ] Return updated comment

- [ ] Create DELETE `/api/comments/:commentId` endpoint
  - [ ] Require authentication (owner or moderator)
  - [ ] Soft delete or status='deleted'
  - [ ] Decrement article comment counter

### Threading (Replies)
- [ ] Support parent_comment_id field
- [ ] When fetching comments, include replies if parent_comment_id is null
- [ ] Limit nesting to 1 level (no nested replies)

### Likes/Upvotes
- [ ] Create POST `/api/comments/:commentId/like` endpoint
  - [ ] Require authentication
  - [ ] Create commentLikes record (prevent duplicates)
  - [ ] Increment comment.likes_count
  - [ ] Return updated comment

### Testing
- [ ] Create comment (check status='pending')
- [ ] Verify non-approved comments not in list
- [ ] Reply to comment (parent_comment_id set)
- [ ] Like comment (likes_count incremented)

---

## 👮 Moderation System (Week 2: Days 1-2)

### Moderation Endpoints
- [ ] Create GET `/api/moderation/pending` endpoint
  - [ ] Return comments with status='pending'
  - [ ] Include comment, user, article info
  - [ ] Require moderator role

- [ ] Create POST `/api/comments/:commentId/moderate` endpoint
  - [ ] Accept action: 'approved' | 'rejected' | 'flagged' | 'removed'
  - [ ] Accept optional reason
  - [ ] Update comment.status
  - [ ] Create moderation_log entry
  - [ ] Create notification for comment author
  - [ ] Invalidate comment cache
  - [ ] Return success

### Spam Detection
- [ ] Auto-flag if >3 flags from community
- [ ] Auto-hide if status='spam'
- [ ] Track spam score (% spam vs total for user)
- [ ] Rate limit comments after spam (1 comment/hour)

### Audit Trail
- [ ] Track all moderation actions in moderation_log
- [ ] Include: comment_id, moderator_id, action, reason, timestamp
- [ ] Make available to admins via dashboard

### Testing
- [ ] Create comment (pending)
- [ ] Approve comment (status → approved, notification sent)
- [ ] Reject comment (status → rejected, reason logged)
- [ ] Flag spam (after 3 flags, auto-hidden)

---

## 📑 Bookmarks System (Week 2: Day 3)

### Basic CRUD
- [ ] Create POST `/api/bookmarks` endpoint
  - [ ] Require authentication
  - [ ] Validate article_id, article_title, article_url
  - [ ] Create with user_id + article_id (unique constraint)
  - [ ] Return 409 if duplicate
  - [ ] Return bookmark response

- [ ] Create GET `/api/bookmarks/user` endpoint
  - [ ] Require authentication
  - [ ] Return all bookmarks for user
  - [ ] Order by created_at DESC

- [ ] Create GET `/api/bookmarks/:bookmarkId` endpoint
  - [ ] Return single bookmark

- [ ] Create DELETE `/api/bookmarks/:bookmarkId` endpoint
  - [ ] Require authentication (owner)
  - [ ] Delete bookmark
  - [ ] Return success

### Sync on Login
- [ ] Create POST `/api/bookmarks/sync` endpoint
  - [ ] Accept array of article_ids from localStorage
  - [ ] Create missing bookmarks for user
  - [ ] Ignore duplicates
  - [ ] Return count of synced bookmarks

### Testing
- [ ] Create bookmark
- [ ] Verify duplicate returns 409
- [ ] List all bookmarks
- [ ] Sync local bookmarks on login
- [ ] Delete bookmark

---

## 🧠 Expert Q&A System (Week 2: Days 4-5)

### Basic CRUD
- [ ] Create POST `/api/qa` endpoint
  - [ ] Require authentication
  - [ ] Only experts (verified) can submit (check role + verified)
  - [ ] Validate question, answer, category
  - [ ] Create with published=false (draft)
  - [ ] Return QA response

- [ ] Create GET `/api/qa` endpoint
  - [ ] Return only published=true
  - [ ] Include expert name + credentials
  - [ ] Order by helpful_count DESC (or recent)
  - [ ] Support filter by category
  - [ ] Increment views_count on each call

- [ ] Create GET `/api/qa/:qaId` endpoint
  - [ ] Return single Q&A
  - [ ] Increment views_count

- [ ] Create PATCH `/api/qa/:qaId` endpoint
  - [ ] Require authentication (author or admin)
  - [ ] Update question/answer/category
  - [ ] Track edit history

- [ ] Create POST `/api/qa/:qaId/publish` endpoint
  - [ ] Require expert role (author)
  - [ ] Set published=true
  - [ ] Notify interested users
  - [ ] Return updated QA

### Helpful Voting
- [ ] Create POST `/api/qa/:qaId/helpful` endpoint
  - [ ] Require authentication
  - [ ] Prevent duplicate votes (user can vote once)
  - [ ] Increment helpful_count
  - [ ] Return updated QA

### Testing
- [ ] Create Q&A (published=false initially)
- [ ] Publish Q&A (visible to users)
- [ ] Mark as helpful (helpful_count incremented)
- [ ] Verify only published visible in list

---

## ✅ Expert Verification (Week 3: Day 1)

### Verification Request
- [ ] Create POST `/api/expert/verify` endpoint
  - [ ] Require authentication
  - [ ] Accept credentials, specialty, years_experience, bio
  - [ ] Create expert_verification record with status='pending'
  - [ ] Notify admins

- [ ] Create GET `/api/expert/verify/requests` endpoint
  - [ ] Return pending verification requests
  - [ ] Require admin role
  - [ ] Include user info + credentials

- [ ] Create POST `/api/expert/verify/:requestId/approve` endpoint
  - [ ] Require admin role
  - [ ] Set request.status='approved'
  - [ ] Set request.verified_at = now()
  - [ ] Update user.verified=true, role='expert'
  - [ ] Notify user (expert badge!)
  - [ ] Return success

- [ ] Create POST `/api/expert/verify/:requestId/reject` endpoint
  - [ ] Require admin role
  - [ ] Set status='rejected'
  - [ ] Notify user with reason (optional)
  - [ ] Return success

### Testing
- [ ] Request expert verification
- [ ] Admin approves (user.verified=true)
- [ ] User can now submit Q&A

---

## 🔔 Notifications System (Week 3: Days 2-3)

### REST Endpoints
- [ ] Create GET `/api/notifications` endpoint
  - [ ] Require authentication
  - [ ] Return unread + recent notifications
  - [ ] Order by created_at DESC
  - [ ] Support limit/offset pagination

- [ ] Create POST `/api/notifications/:id/read` endpoint
  - [ ] Mark notification as read=true
  - [ ] Return success

- [ ] Create DELETE `/api/notifications/:id` endpoint
  - [ ] Delete notification
  - [ ] Return success

- [ ] Create POST `/api/notifications/mark-all-read` endpoint
  - [ ] Mark all user notifications as read
  - [ ] Return count

### WebSocket (Real-time)
- [ ] Setup Socket.io server on separate port or same server
- [ ] Authenticate WebSocket connection via token
- [ ] Handle `connection` event
  - [ ] Get user from token
  - [ ] Join user-specific room: `socket.join(`user:${userId}`)`
  - [ ] Track active connections

- [ ] Create notification sending function
  - [ ] Create DB record
  - [ ] Check if user online
  - [ ] Send via WebSocket if online: `io.to(`user:${userId}`).emit('notification', data)`
  - [ ] Send email if offline (optional)

- [ ] Handle `disconnect` event
  - [ ] Remove from active connections

### Newsletter
- [ ] Create POST `/api/newsletter/subscribe` endpoint
  - [ ] Accept email + category (all, health, education, legal, weekly_digest)
  - [ ] Create email_subscriptions record
  - [ ] Send confirmation email
  - [ ] Return subscription_id

- [ ] Create POST `/api/newsletter/unsubscribe` endpoint
  - [ ] Accept email or unsubscribe token
  - [ ] Set subscribed=false + unsubscribed_at
  - [ ] Return success

### Email Notifications (Optional for MVP)
- [ ] Create background job for sending emails
- [ ] Send email on new comment reply (if subscribed)
- [ ] Send email on new Q&A answer
- [ ] Send weekly digest to subscribers

### Testing
- [ ] Create notification (via comment/Q&A/etc)
- [ ] Verify in GET /notifications
- [ ] Mark as read
- [ ] Test WebSocket real-time delivery
- [ ] Subscribe to newsletter

---

## 📊 User Activity Tracking (Week 3: Day 4)

- [ ] Create POST `/api/activity` endpoint
  - [ ] Accept activity_type (article_read, comment_posted, bookmark_saved, qa_viewed, shared)
  - [ ] Accept optional article_id + metadata
  - [ ] Create user_activity record

- [ ] Create cron job to aggregate stats
  - [ ] Count comments per article
  - [ ] Track expert Q&A stats (views, helpful)
  - [ ] Track user engagement (articles read, comments, bookmarks)

- [ ] Create GET `/api/analytics` endpoint (internal only)
  - [ ] Return engagement metrics
  - [ ] Return top articles
  - [ ] Return top experts

### Testing
- [ ] Track article read
- [ ] Track comment posted
- [ ] Verify activity in database

---

## 🧪 Testing & QA (Week 3: Day 5 + Week 4)

### Unit Tests
- [ ] Authentication service (register, login, token refresh)
- [ ] Comment validation (content length, article_id format)
- [ ] Moderation (approve/reject logic)
- [ ] Q&A publishing (draft to published)

### Integration Tests
- [ ] Full auth flow (register → login → bookmark → logout)
- [ ] Comment moderation flow (create → pending → approve → visible)
- [ ] Expert verification (request → approve → can submit Q&A)
- [ ] Notification on new comment
- [ ] WebSocket real-time updates

### Load Testing
- [ ] Simulate 100 concurrent users
- [ ] Test comment creation under load
- [ ] Test notification delivery speed
- [ ] Verify database query performance

### Security Tests
- [ ] SQL injection attempts on comments
- [ ] XSS attempts in Q&A content
- [ ] CSRF token validation
- [ ] Rate limiting on auth endpoints
- [ ] JWT token tampering
- [ ] Access control (non-moderators can't approve)

### Manual Testing
- [ ] Register new user → email verification
- [ ] Login → bookmarks visible
- [ ] Create comment → see pending state → approve → visible
- [ ] Request expert verification → approve → can submit Q&A
- [ ] Like comment → count updates
- [ ] Subscribe newsletter → receive emails

---

## 🚀 Deployment (Week 4)

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Environment variables set (production)
- [ ] Database backups scheduled
- [ ] Monitoring configured (Sentry, DataDog)
- [ ] Logging configured (CloudWatch, Papertrail)

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Test email delivery (Gmail, SendGrid)
- [ ] Test WebSocket connections
- [ ] Load test with production-like data

### Production Deployment
- [ ] Database migrated
- [ ] API deployed
- [ ] WebSocket server running
- [ ] SSL/TLS configured
- [ ] CDN cache configured
- [ ] Domain DNS updated
- [ ] Monitoring alerts active

### Post-Deployment
- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor API response times (target: <200ms)
- [ ] Monitor WebSocket connections
- [ ] Verify emails sending
- [ ] Verify notifications working
- [ ] Verify bookmarks syncing

---

## 📈 Success Metrics (Target)

| Metric | Target | How to Verify |
|--------|--------|---------------|
| API Response Time | <200ms | APM dashboard (Datadog) |
| Error Rate | <0.1% | Error logging (Sentry) |
| Uptime | 99.9% | Uptime monitoring |
| WebSocket Latency | <100ms | Log notification delivery times |
| Email Delivery | 99% | Email service logs |
| Database Query Time | <100ms | Query analyzer logs |
| Moderation Response | <4 hrs | Manual tracking |
| Expert Verification | <24 hrs | Manual tracking |

---

## 🎯 Phase 6 Timeline

| Week | Focus | Owner |
|------|-------|-------|
| Week 1 | Infrastructure + Auth + Comments | Backend Lead |
| Week 2 | Moderation + Bookmarks + Q&A | Backend Team |
| Week 3 | Expert Verification + Notifications | Backend Team |
| Week 3-4 | Testing + Deployment | QA + DevOps |
| Week 4 | Frontend Integration + Launch | Full Team |

---

## ✨ After Launch: Phase 6.2

- [ ] User engagement dashboard
- [ ] Advanced search (Elasticsearch)
- [ ] Recommendation engine
- [ ] Comment threading UI improvements
- [ ] Expert profile pages
- [ ] Reading lists / Learning paths
- [ ] Mobile app (React Native)
- [ ] Analytics reporting
- [ ] Community moderation tools

---

## Phase 6: Ready to Execute

All infrastructure documented. Follow this checklist and you'll have a production-ready community platform in 4 weeks.

**Questions?** Refer to:
1. `PHASE_6_ARCHITECTURE.md` (system design)
2. `API_IMPLEMENTATION_GUIDE.md` (code patterns)
3. `PHASE_6_FAQ.md` (troubleshooting)
