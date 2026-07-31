# Deployment Guide: Week 4

## Pre-Deployment Checklist

### Code Quality ✅
- [x] TypeScript compilation without errors
- [x] All tests passing (unit + integration)
- [x] Load testing passed (100 concurrent users)
- [x] Code review completed
- [x] ESLint compliance
- [x] No console.log in production code

### Security ✅
- [x] JWT secrets configured (strong + unique)
- [x] Password hashing with bcrypt
- [x] Input validation (Zod)
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS protection (JSON responses)
- [x] CSRF tokens (implicit in JWT)
- [x] Rate limiting configured
- [x] CORS properly scoped

### Database ✅
- [x] Schema migrations created
- [x] Indexes optimized
- [x] Foreign key constraints
- [x] Soft delete support
- [x] Backup strategy defined
- [x] Monitoring queries for slow queries

### Environment ✅
- [x] .env.example documented
- [x] All secrets in environment variables
- [x] No hardcoded credentials
- [x] Different configs per environment (dev/staging/prod)

---

## Staging Deployment

### 1. Prepare Staging Server

```bash
# SSH into staging server
ssh user@staging.downtogether.org

# Clone repository
git clone https://github.com/your-org/down-together.git
cd down-together/backend

# Copy environment
cp .env.example .env.staging
# Edit .env.staging with staging credentials
```

### 2. Install Dependencies & Setup

```bash
# Install Node.js (v18+)
nvm install 18
nvm use 18

# Install dependencies
npm ci  # Use npm ci instead of npm install for reproducibility

# Build TypeScript
npm run build

# Run database migrations
npx prisma migrate deploy
```

### 3. Configure Environment

```bash
# Edit .env.staging
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://user:pass@staging-db:5432/downtogether
JWT_SECRET=<generate-secure-key>
JWT_REFRESH_SECRET=<generate-secure-key>
SMTP_HOST=smtp.gmail.com
SMTP_USER=staging@downtogether.org
SMTP_PASS=<app-password>
CORS_ORIGIN=https://staging.downtogether.org
```

### 4. Start Application

```bash
# Using PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start dist/server.js --name "down-together-api" --env NODE_ENV=staging

# Enable startup on reboot
pm2 startup
pm2 save

# Monitor
pm2 logs down-together-api
```

### 5. Configure Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/staging.downtogether.org

server {
    listen 443 ssl http2;
    server_name staging.downtogether.org;

    ssl_certificate /etc/letsencrypt/live/staging.downtogether.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.downtogether.org/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /ws {
        proxy_pass http://localhost:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name staging.downtogether.org;
    return 301 https://$server_name$request_uri;
}
```

### 6. Run Smoke Tests

```bash
# Test health endpoint
curl https://staging.downtogether.org/health

# Test registration
curl -X POST https://staging.downtogether.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@staging.com","name":"Test","password":"TestPass123!"}'

# Test Q&A endpoint
curl https://staging.downtogether.org/api/qa

# Test WebSocket
npx socket.io-client "wss://staging.downtogether.org" --auth '{"token":"mock-token"}'
```

### 7. Email Configuration

```bash
# Verify SMTP credentials work
npm run test:email

# Check email verification flow
# 1. Register account
# 2. Check email inbox for verification link
# 3. Click link and verify account works
```

### 8. Database Backup

```bash
# Test backup process
pg_dump -U postgres downtogether > backup_test.sql

# Schedule daily backups
0 2 * * * pg_dump -U postgres downtogether | gzip > /backups/downtogether-$(date +\%Y\%m\%d).sql.gz
```

### 9. Enable Monitoring

```bash
# Setup Sentry for error tracking
# 1. Create Sentry project
# 2. Add SENTRY_DSN to .env
# 3. Test: curl https://staging.downtogether.org/nonexistent

# Setup DataDog for performance
# 1. Install DataDog agent
# 2. Add DD_TRACE_ENABLED=true to .env
# 3. Monitor dashboard
```

---

## Production Deployment

### 1. Production Server Setup

```bash
# SSH into production
ssh user@api.downtogether.org

# Similar to staging setup
git clone https://github.com/your-org/down-together.git
cd down-together/backend
```

### 2. Prepare Production Environment

```bash
# Use strong secrets
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For JWT_REFRESH_SECRET

# Create .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:secure-pass@prod-db-cluster:5432/downtogether
JWT_SECRET=<secure-64-char-string>
JWT_REFRESH_SECRET=<secure-64-char-string>
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
CORS_ORIGIN=https://downtogether.org
SENTRY_DSN=https://xxx@sentry.io/yyy
REDIS_URL=redis://prod-redis-cluster:6379
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Production database must be:
# - High availability (replicated)
# - Automated backups (daily)
# - Encryption at rest
# - Connection pooling (PgBouncer or similar)

# Run migrations on production
npx prisma migrate deploy

# Verify migrations
psql $DATABASE_URL -c "SELECT version FROM _prisma_migrations;"
```

### 4. Production Start

```bash
# Using PM2 cluster mode for multiple workers
pm2 start dist/server.js -i max --name "down-together-api"

# Or using Docker
docker build -t down-together-api:latest .
docker run -d \
  --name down-together-api \
  -p 3000:3000 \
  --env-file .env.production \
  down-together-api:latest
```

### 5. Configure CDN (Cloudflare)

```
- Enable Full (strict) SSL/TLS
- Set HTTP/2
- Enable compression (gzip, brotli)
- Configure rate limiting (in Cloudflare dashboard)
- Enable caching for /health endpoint
- Add WAF rules for SQL injection protection
```

### 6. Enable Monitoring & Alerting

```bash
# Prometheus metrics
npm install prom-client

# Setup alerts
- Error rate > 1%
- Response time p95 > 500ms
- Database connection pool exhausted
- Disk usage > 80%
- Memory usage > 85%
- WebSocket connections > 10,000
```

### 7. Health Checks

```bash
# Automated health checks every 1 minute
- GET /health should return 200
- Database connectivity check
- Redis connectivity check (if used)
- Email service check (test send)
```

### 8. Database Backups

```bash
# Daily automated backups to S3
0 1 * * * /opt/backup-db.sh

# Keep:
# - Last 7 daily backups
# - Last 4 weekly backups
# - Last 12 monthly backups

# Test restore monthly
0 3 * * 0 /opt/test-restore.sh
```

### 9. SSL/TLS Certificates

```bash
# Use Let's Encrypt with auto-renewal
certbot certonly --webroot -w /var/www/letsencrypt -d downtogether.org -d api.downtogether.org

# Auto-renewal (systemd timer or cron)
0 12 * * * certbot renew --quiet
```

### 10. Logging & Monitoring

```bash
# Centralized logging
- Structured JSON logs
- ELK Stack or CloudWatch
- Search logs by user_id, error type, endpoint
- Alert on ERROR level logs

# Performance monitoring
- Track API response times by endpoint
- Monitor database query times
- WebSocket connection metrics
- Error rates by type

# Business metrics
- New user registrations
- Active users
- Comments posted
- Q&A published
- Newsletter subscribers
```

---

## Post-Deployment Verification

### 1. Smoke Tests (Production)

```bash
# Health endpoint
curl https://api.downtogether.org/health

# Auth flow
RESPONSE=$(curl -s -X POST https://api.downtogether.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prod-test@example.com","name":"Prod Test","password":"TestPass123!"}')

TOKEN=$(echo $RESPONSE | jq -r '.token.access_token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://api.downtogether.org/api/notifications

# Test WebSocket
npx socket.io-client "wss://api.downtogether.org" --auth "{\"token\":\"$TOKEN\"}"
```

### 2. Frontend Integration

```bash
# Update frontend API URL to production
# Deploy frontend
# Test full workflows:
# 1. User registration
# 2. Comment creation & approval
# 3. Bookmark sync
# 4. Q&A publishing
# 5. Real-time notifications
```

### 3. Email Verification

```bash
# Test all email types
1. Verify email on registration
2. Comment approved notification
3. Expert verification approval
4. Newsletter digest
5. Unsubscribe link
```

### 4. Performance Baselines

Document baseline metrics:
- API response times
- Database query times
- WebSocket latency
- Error rates
- Uptime %

---

## Rollback Plan

If critical issues occur:

```bash
# 1. Switch to previous version
git checkout previous-commit
npm run build
pm2 restart down-together-api

# 2. Revert database if needed
pg_restore < /backups/downtogether-backup.sql

# 3. Clear caches
pm2 delete down-together-api
redis-cli FLUSHALL

# 4. Notify team
# - Status page update
# - Slack notification
# - Customer email if needed
```

---

## Maintenance

### Weekly
- Monitor error rates
- Check backup status
- Review slow query logs

### Monthly
- Security updates
- Database optimization
- Test disaster recovery

### Quarterly
- Load testing
- Security audit
- Architecture review

---

## Support

For deployment issues:
1. Check application logs: `pm2 logs down-together-api`
2. Check Sentry for errors
3. Check DataDog for performance issues
4. Check database metrics
5. Check WebSocket connections

---

**Status**: Deployment-ready ✅
