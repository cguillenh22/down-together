# Post-Deployment Verification: Down Together Production

**Launch Date**: 2026-07-31  
**Status**: Deployed  
**Verification Window**: First 24 hours (critical)  

---

## ✅ IMMEDIATE VERIFICATION (First 15 mins)

### Infrastructure
- [ ] API server responding
  ```bash
  curl https://api.downtogether.org/health
  # Expected: {"status":"ok","timestamp":"..."}
  ```
- [ ] Frontend loading
  ```bash
  curl https://downtogether.org -I
  # Expected: HTTP 200 OK
  ```
- [ ] SSL certificates valid
  ```bash
  curl -I https://api.downtogether.org
  # Expected: certificate chain OK, no warnings
  ```
- [ ] WebSocket responding
  ```bash
  websocat "wss://api.downtogether.org/ws" -H "Authorization: Bearer test"
  # Expected: connection established
  ```

### Database
- [ ] Migrations applied
  ```bash
  ssh deploy@api.downtogether.org
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM _prisma_migrations;"
  # Expected: >0 (shows migrations applied)
  ```
- [ ] Tables created
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
  # Expected: >=11 (all tables)
  ```
- [ ] No data corruption
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM articles;"
  # Expected: logical counts (0 users is OK for new launch)
  ```

### Error Tracking
- [ ] Sentry connected
  - Open Sentry dashboard
  - [ ] Down Together project visible
  - [ ] Test event appears when logged
- [ ] No critical errors
  - [ ] Error count: 0 in first hour
  - [ ] No 5xx errors
  - [ ] No database connection errors

---

## 🔐 SECURITY VERIFICATION (15-30 mins)

### Authentication
- [ ] Register new user works
  ```bash
  curl -X POST https://api.downtogether.org/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{
      "email":"'$(date +%s)'@test.com",
      "name":"Test User",
      "password":"SecurePass123!"
    }'
  # Expected: user created, tokens returned
  ```
- [ ] Login returns valid JWT
  ```bash
  TOKEN=$(curl -s -X POST https://api.downtogether.org/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"...","password":"..."}' | jq -r '.access_token')
  echo $TOKEN | jq -R 'split(".") | .[1] | @base64d | fromjson'
  # Expected: valid JWT payload with user_id, role
  ```
- [ ] Token refresh works
  ```bash
  curl -X POST https://api.downtogether.org/api/auth/refresh \
    -H "Content-Type: application/json" \
    -d '{"refresh_token":"'$REFRESH_TOKEN'"}'
  # Expected: new access_token returned
  ```
- [ ] Unauthorized access blocked
  ```bash
  curl https://api.downtogether.org/api/comments \
    -H "Authorization: Bearer invalid"
  # Expected: 401 Unauthorized
  ```

### CORS & Headers
- [ ] CORS properly configured
  ```bash
  curl -I https://api.downtogether.org \
    -H "Origin: https://downtogether.org"
  # Expected: Access-Control-Allow-Origin header present
  ```
- [ ] Security headers present
  ```bash
  curl -I https://api.downtogether.org
  # Expected: X-Content-Type-Options, X-Frame-Options, etc.
  ```

---

## 🚀 FEATURE VERIFICATION (30-45 mins)

### Comments System
- [ ] Create comment works
  ```bash
  curl -X POST https://api.downtogether.org/api/comments \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "article_id":"test-article",
      "content":"Great article!"
    }'
  # Expected: comment created, status=pending
  ```
- [ ] Get comments works
  ```bash
  curl https://api.downtogether.org/api/comments/article/test-article
  # Expected: approved comments list
  ```
- [ ] Like comment works
  ```bash
  curl -X POST https://api.downtogether.org/api/comments/$COMMENT_ID/like \
    -H "Authorization: Bearer $TOKEN"
  # Expected: like count incremented
  ```

### Bookmarks
- [ ] Add bookmark works
  ```bash
  curl -X POST https://api.downtogether.org/api/bookmarks \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "article_id":"test",
      "article_title":"Test Article",
      "article_url":"https://example.com/test"
    }'
  # Expected: bookmark created
  ```
- [ ] List bookmarks works
  ```bash
  curl https://api.downtogether.org/api/bookmarks/user \
    -H "Authorization: Bearer $TOKEN"
  # Expected: bookmarks array returned
  ```

### Expert Q&A
- [ ] Q&A list endpoint works
  ```bash
  curl https://api.downtogether.org/api/qa
  # Expected: Q&A array (empty if none published yet)
  ```
- [ ] Create Q&A fails for non-expert
  ```bash
  curl -X POST https://api.downtogether.org/api/qa \
    -H "Authorization: Bearer $MEMBER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"question":"...","answer":"..."}'
  # Expected: 403 Forbidden (member not expert)
  ```

### Notifications
- [ ] Get notifications works
  ```bash
  curl https://api.downtogether.org/api/notifications \
    -H "Authorization: Bearer $TOKEN"
  # Expected: notifications array
  ```
- [ ] Newsletter subscribe works
  ```bash
  curl -X POST https://api.downtogether.org/api/newsletter/subscribe \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"'$EMAIL'"}'
  # Expected: subscription confirmed
  ```

---

## 📊 PERFORMANCE VERIFICATION (45-60 mins)

### Response Times
- [ ] API response time <200ms
  ```bash
  time curl https://api.downtogether.org/api/qa
  # Expected: real time < 200ms
  ```
- [ ] Frontend load time <2s
  ```bash
  time curl https://downtogether.org > /dev/null
  # Expected: total time < 2s
  ```
- [ ] WebSocket latency <100ms
  - Open browser DevTools
  - [ ] WebSocket connection established
  - [ ] Message round-trip < 100ms

### Database Performance
- [ ] Query latency acceptable
  ```bash
  ssh deploy@api.downtogether.org
  pm2 logs down-together-api | grep "Query time"
  # Expected: most queries <50ms
  ```
- [ ] No slow query logs
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_stat_statements WHERE mean_time > 1000;"
  # Expected: 0 (no queries taking >1s average)
  ```

### Browser Performance
Open https://downtogether.org in browser:
- [ ] Page loads in <2s
- [ ] CSS loads correctly (no broken styling)
- [ ] Images display properly
- [ ] Dark mode works (toggle in settings)
- [ ] Responsive on mobile (use DevTools)

---

## 📱 BROWSER & DEVICE TESTING (60-75 mins)

### Desktop Chrome
- [ ] Register flow works
- [ ] Login flow works
- [ ] Can create comment
- [ ] Can add bookmark
- [ ] Notifications appear
- [ ] No console errors (F12)

### Desktop Firefox
- [ ] Same as Chrome
- [ ] CORS handling correct

### Mobile Safari
- [ ] [ ] Responsive layout working
- [ ] [ ] Touch interactions work
- [ ] [ ] Forms submittable
- [ ] [ ] No layout shift

### Mobile Chrome
- [ ] Same as Safari
- [ ] Progressive Web App features working (if applicable)

---

## 🔍 MONITORING & ALERTING (75-90 mins)

### Sentry Dashboard
- [ ] Project created and receiving events
- [ ] Release tagged
  ```
  Release: down-together@2026-07-31
  ```
- [ ] Environments configured
  - [ ] Production environment visible
  - [ ] Error rate tracking
  - [ ] User feedback enabled
- [ ] Alerts configured
  - [ ] Email on >5 errors/min
  - [ ] Alert rules working

### DataDog (if configured)
- [ ] Agent installed on servers
- [ ] Metrics flowing:
  - [ ] CPU usage
  - [ ] Memory usage
  - [ ] Network throughput
  - [ ] Database connections
- [ ] APM (Application Performance Monitoring)
  - [ ] Traces captured
  - [ ] Latency recorded
  - [ ] Endpoint metrics visible

### Logs
- [ ] Backend logs accessible
  ```bash
  pm2 logs down-together-api
  # Expected: clean startup, no errors
  ```
- [ ] No error spam in logs
- [ ] Structured logging working

---

## 📧 EMAIL & NOTIFICATIONS (90-105 mins)

### Email System
- [ ] Registration email sent
  - [ ] Received in test mailbox
  - [ ] Contains verification link
  - [ ] Link is clickable
- [ ] Comment notification email sent
  - [ ] Contains comment content
  - [ ] Reply link works
- [ ] Newsletter email sent
  - [ ] HTML formatting correct
  - [ ] Unsubscribe link present
  - [ ] No spam markers

### In-App Notifications
- [ ] WebSocket notifications received
- [ ] Browser notifications appear (if enabled)
- [ ] Notification badge increments
- [ ] Mark as read works
- [ ] Delete notification works

---

## 🎯 END-TO-END USER FLOW (105-120 mins)

### Flow 1: New User Registration & Bookmarking
1. [ ] Navigate to https://downtogether.org
2. [ ] Register account
   - [ ] Email verification received
   - [ ] Email verified
   - [ ] Logged in automatically
3. [ ] Find article
4. [ ] Bookmark article
   - [ ] Bookmark icon shows filled
   - [ ] Bookmark count increments
5. [ ] Go to bookmarks
   - [ ] Article appears in list
6. [ ] Remove bookmark
   - [ ] Removes from list

### Flow 2: Comment & Moderation
1. [ ] Member posts comment
   - [ ] Shows "pending" status
   - [ ] Not visible to other users
2. [ ] Moderator approves comment
   - [ ] Comment visible to all
   - [ ] Commenter gets notification
3. [ ] User likes comment
   - [ ] Like count increments
   - [ ] Own like is tracked

### Flow 3: Expert Q&A
1. [ ] User requests expert verification
   - [ ] Request submitted
2. [ ] Admin approves verification
   - [ ] User becomes "expert"
3. [ ] Expert creates Q&A
   - [ ] Starts as "draft"
   - [ ] Not visible publicly
4. [ ] Expert publishes
   - [ ] Visible in Q&A section
   - [ ] View count increments
5. [ ] Users mark helpful
   - [ ] Helpful count increments

### Flow 4: Newsletter Subscription
1. [ ] User subscribes to newsletter
2. [ ] Confirmation email received
3. [ ] Admin sends email
4. [ ] User receives newsletter
5. [ ] Unsubscribe link works
   - [ ] Removes from subscription list

---

## 🚨 COMMON ISSUES CHECKLIST

### If You See...

**Error 503 - Service Unavailable**
- [ ] Check API server status: `pm2 list`
- [ ] Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
- [ ] Restart API: `pm2 restart down-together-api`
- [ ] Check logs: `pm2 logs down-together-api --lines 100`

**CORS Errors in Browser**
- [ ] Verify CORS_ORIGIN in .env matches frontend domain
- [ ] Frontend and API on different domains?
- [ ] Restart API after .env change

**Database Connection Errors**
- [ ] Verify DATABASE_URL is correct
- [ ] Check PostgreSQL is running
- [ ] Verify network connectivity: `psql $DATABASE_URL -c "SELECT 1"`
- [ ] Check database user permissions

**WebSocket Connection Failed**
- [ ] Verify WebSocket port accessible: `curl ws://localhost:3000`
- [ ] Check firewall allows port 3000
- [ ] Verify JWT token in headers

**Email Not Sending**
- [ ] Check SMTP credentials: `cat .env | grep SMTP`
- [ ] Test SMTP: `telnet smtp.sendgrid.net 587`
- [ ] Check error logs: `pm2 logs down-together-api | grep -i email`

---

## 📋 DAILY MONITORING (First Week)

### Daily at 9am
- [ ] Check error rate (Sentry)
- [ ] Verify uptime (Status page)
- [ ] Review performance metrics (DataDog)
- [ ] Check user registrations
- [ ] Review support emails

### Daily at 6pm
- [ ] Database backup verified
- [ ] No disk space issues
- [ ] No error spikes
- [ ] Performance stable

### Weekly Review
- [ ] Total users
- [ ] Total comments
- [ ] Total Q&A views
- [ ] Newsletter subscribers
- [ ] Feature adoption
- [ ] Support tickets

---

## ✅ FINAL VERIFICATION CHECKLIST

### Before Declaring Success
- [ ] All health checks passing
- [ ] Error rate <0.1%
- [ ] Response time <200ms p95
- [ ] WebSocket latency <100ms
- [ ] Zero 5xx errors
- [ ] All features tested
- [ ] Email working
- [ ] Monitoring active
- [ ] Team briefed
- [ ] Support ready
- [ ] Stakeholders notified

### Sign-Off
- [ ] Date: ________________
- [ ] Verified by: ________________
- [ ] Status: ☐ LIVE | ☐ ROLLBACK NEEDED

---

## 🎉 LAUNCH SUCCESS INDICATORS

**If you see all green indicators:**
✅ API responding <200ms  
✅ Zero critical errors  
✅ Users can register  
✅ Users can bookmark  
✅ Users can comment  
✅ Expert Q&A working  
✅ Notifications flowing  
✅ Email system operational  
✅ Monitoring active  
✅ Team confident  

**Then: DOWN TOGETHER IS LIVE! 🚀**

---

## 📞 EMERGENCY CONTACTS

**API Down**: [On-call engineer]  
**Database Down**: [DBA contact]  
**CDN Down**: [DevOps contact]  
**General Issues**: [Team lead]  

**PagerDuty**: https://pagerduty.com  
**Incident Channel**: #incidents  
**Status Page**: https://status.downtogether.org  

---

**Verification Window**: First 24 hours critical  
**Target**: 100% systems operational  
**Risk Mitigation**: Rollback plan ready  

**GO LIVE WITH CONFIDENCE! 🚀**
