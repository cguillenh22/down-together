# Production Deployment: Down Together Phase 6

## 🎯 Deployment Plan

**Environment**: Production
**Backend URL**: https://api.downtogether.org
**Frontend URL**: https://downtogether.org
**WebSocket**: wss://api.downtogether.org

---

## Pre-Deployment Checklist (48 hours before)

### Code Review ✅
- [ ] All features tested locally
- [ ] No console errors
- [ ] TypeScript compiles cleanly
- [ ] All tests passing
- [ ] Security review passed
- [ ] Performance review passed

### Infrastructure ✅
- [ ] Production servers provisioned
- [ ] PostgreSQL database ready
- [ ] Database replication configured
- [ ] Automated backups scheduled
- [ ] Redis cache ready (optional)
- [ ] CDN configured (Cloudflare)
- [ ] SSL certificates valid
- [ ] DNS records prepared

### Monitoring ✅
- [ ] Sentry configured (error tracking)
- [ ] DataDog configured (APM)
- [ ] CloudWatch configured (logs)
- [ ] Alert rules set
- [ ] Pagerduty integration ready
- [ ] Status page ready

---

## Step 1: Backend Deployment

### 1.1 Prepare Production Environment

```bash
# SSH into production server
ssh deploy@api.downtogether.org

# Create app directory
mkdir -p /var/www/down-together
cd /var/www/down-together

# Clone repository
git clone https://github.com/your-org/down-together.git .
cd backend
```

### 1.2 Install & Configure

```bash
# Use Node 18 LTS
nvm install 18
nvm use 18

# Install dependencies
npm ci

# Create production .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:secure-pass@prod-db-primary:5432/downtogether
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx
CORS_ORIGIN=https://downtogether.org
SENTRY_DSN=https://xxxx@sentry.io/yyyy
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=warn
EOF

# Verify environment
cat .env | grep -v PASS | grep -v SECRET
```

### 1.3 Database Migration

```bash
# Run migrations
npx prisma migrate deploy

# Verify migrations
psql $DATABASE_URL -c "SELECT version FROM _prisma_migrations;"

# Expected: All migrations listed without errors
```

### 1.4 Build & Deploy

```bash
# Build TypeScript
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/server.js \
  --name "down-together-api" \
  --env NODE_ENV=production \
  -i max

# Enable auto-restart
pm2 startup
pm2 save

# Verify running
pm2 list
pm2 logs down-together-api
```

### 1.5 Nginx Configuration

```bash
# Copy nginx config
sudo cp deploy/nginx/down-together-api.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/down-together-api.conf /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

---

## Step 2: Frontend Deployment

### 2.1 Build Frontend

```bash
# Frontend repo
cd /var/www/down-together/frontend

# Install dependencies
npm ci

# Set production environment
cat > .env.production << 'EOF'
PUBLIC_API_URL=https://api.downtogether.org
PUBLIC_WEBSOCKET_URL=wss://api.downtogether.org
PUBLIC_ENV=production
PUBLIC_ENABLE_NOTIFICATIONS=true
PUBLIC_ENABLE_NEWSLETTER=true
PUBLIC_GA_ID=G-XXXXXXXXXX
PUBLIC_ENABLE_GA=true
PUBLIC_SENTRY_DSN=https://xxxx@sentry.io/yyyy
EOF

# Build
npm run build

# Expected output:
# ✓ built in XXs
# dist/ ready
```

### 2.2 Deploy to CDN

```bash
# Option A: Cloudflare Pages (recommended)
npm install -g wrangler
wrangler pages publish dist

# Option B: AWS S3 + CloudFront
aws s3 sync dist/ s3://down-together-prod/ --delete
aws cloudfront create-invalidation --distribution-id E123 --paths "/*"

# Option C: GitHub Pages
git add dist/
git commit -m "Deploy: Production build"
git push origin main
```

---

## Step 3: DNS & SSL

### 3.1 DNS Configuration

```bash
# Update DNS records (via registrar or CloudFlare)
# A record: api.downtogether.org → API server IP
# A record: downtogether.org → CDN IP
# AAAA record: IPv6 addresses (if applicable)
# MX record: mail handling (if needed)
# SPF/DKIM records: for emails

# Verify DNS propagation
dig api.downtogether.org
dig downtogether.org
```

### 3.2 SSL Certificates

```bash
# Let's Encrypt with auto-renewal
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --webroot -w /var/www/down-together/frontend/dist \
  -d downtogether.org -d api.downtogether.org

# Enable auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo certbot certificates
```

---

## Step 4: Verification

### 4.1 Health Checks

```bash
# API health
curl https://api.downtogether.org/health

# Expected: {"status":"ok","timestamp":"..."}

# Frontend health
curl https://downtogether.org

# Expected: HTML content (homepage)
```

### 4.2 End-to-End Tests

```bash
# Register
curl -X POST https://api.downtogether.org/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"prod-test@example.com","name":"Test","password":"TestPass123!"}'

# Login
curl -X POST https://api.downtogether.org/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prod-test@example.com","password":"TestPass123!"}'

# Test Q&A
curl https://api.downtogether.org/api/qa

# Test WebSocket
websocat "wss://api.downtogether.org/ws"
```

### 4.3 Monitor Errors

```bash
# Check Sentry
# https://sentry.io → Select Project → Monitor Errors

# Check DataDog
# https://datadoghq.com → APM → down-together

# Expected: 0 errors in first hour
```

---

## Step 5: Post-Deployment

### 5.1 Monitoring Setup

```bash
# Enable CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --alarm-name down-together-error-rate \
  --alarm-description "Error rate > 1%" \
  --metric-name ErrorRate \
  --threshold 1.0 \
  --comparison-operator GreaterThanThreshold

# Enable PagerDuty notifications
# Configure in AWS SNS → PagerDuty integration
```

### 5.2 Database Backups

```bash
# Test backup
pg_dump -U postgres downtogether | gzip > /backups/production-backup-$(date +%Y%m%d).sql.gz

# Schedule daily backups
crontab -e
# 0 2 * * * /opt/backup-production.sh
```

### 5.3 Performance Baseline

```bash
# Record baseline metrics
echo "API Response Time: $(date) - Pending DataDog metrics"
echo "WebSocket Connections: TBD"
echo "Database Queries: TBD"
echo "Error Rate: Monitor in Sentry"
echo "Uptime: Monitor in status page"
```

---

## Rollback Plan (If Needed)

### Immediate Rollback (< 5 minutes)

```bash
# Stop current version
pm2 stop down-together-api

# Revert to previous commit
git reset --hard HEAD~1

# Rebuild & restart
npm run build
pm2 restart down-together-api

# Verify
curl https://api.downtogether.org/health
```

### Database Rollback

```bash
# If migrations failed
npx prisma migrate resolve --rolled-back MIGRATION_ID

# Restore from backup
pg_restore -U postgres -d downtogether /backups/production-backup-TIMESTAMP.sql.gz
```

---

## 24-Hour Monitoring

### First Hour
- [ ] 0 errors in Sentry
- [ ] API response time <200ms
- [ ] WebSocket connections stable
- [ ] All features working

### First Day
- [ ] Error rate <0.1%
- [ ] Uptime 100%
- [ ] Performance stable
- [ ] No user complaints

### First Week
- [ ] Error rate <0.05%
- [ ] Uptime 99.9%
- [ ] Performance optimized
- [ ] Users actively using

---

## Post-Deployment Tasks

### Day 1
- [ ] Monitor Sentry for errors
- [ ] Check user activity in analytics
- [ ] Verify all workflows working
- [ ] Test email notifications

### Week 1
- [ ] Gather user feedback
- [ ] Optimize slow queries
- [ ] Fine-tune caching
- [ ] Update documentation

### Month 1
- [ ] Review analytics
- [ ] Collect feature requests
- [ ] Plan Phase 7 improvements
- [ ] Security audit

---

## Success Criteria

| Metric | Target | Status |
|--------|--------|--------|
| Uptime | 99.9% | ⏳ |
| Error Rate | <0.1% | ⏳ |
| API Response | <200ms p95 | ⏳ |
| WebSocket | <100ms latency | ⏳ |
| User Registrations | >100 day 1 | ⏳ |
| Comments Posted | >500 week 1 | ⏳ |

---

## Emergency Contacts

- **On-Call Engineer**: [Phone number]
- **DevOps Lead**: [Contact]
- **Product Manager**: [Contact]
- **CEO**: [Emergency contact]

**PagerDuty**: https://pagerduty.com
**Status Page**: https://status.downtogether.org
**Incident Channel**: #incidents

---

## Deployment Complete Checklist

- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] DNS configured
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] End-to-end tests passing
- [ ] Monitoring enabled
- [ ] Backup verified
- [ ] Team notified
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Post-deployment monitoring started

---

**Status**: Ready for Production Deployment 🚀
**Estimated Time**: 2-3 hours for full deployment
**Risk Level**: Low (comprehensive rollback plan)
**Support**: 24/7 monitoring enabled

Proceed with deployment when all checklist items complete.
