# Phase 6.1: Frontend Integration

## ✅ Started: Frontend-Backend Connection

### 🔗 HTTP Client Layer

**Created**: `src/lib/http-client.ts`
- Centralized API communication
- Automatic retry logic (exponential backoff)
- Request timeout handling
- Token refresh on 401
- Consistent error handling
- File upload support
- Type-safe responses

**Features**:
- Retry with exponential backoff (3 attempts default)
- 30-second timeout per request
- Bearer token auto-injection
- JSON response parsing
- Automatic token refresh flow
- Multipart form data support

**Methods**:
```typescript
httpClient.get<T>(path, config?)
httpClient.post<T>(path, body?, config?)
httpClient.patch<T>(path, body?, config?)
httpClient.delete<T>(path, config?)
httpClient.uploadFile<T>(path, file, additionalData?)
```

### 🔐 Updated AuthService

**File**: `src/lib/auth.ts` (Updated)
- Now uses httpClient instead of raw fetch
- Automatic retry on failure
- Better error handling
- Token refresh flow improved
- Added `getCurrentUser()` method
- SSR-safe (checks for window object)

**New Methods**:
```typescript
getCurrentUser(): { id, email, role } | null
  // Decode JWT and get user info
```

### 🌍 Environment Configuration

**Created**: `.env.example.frontend`
- API URL configuration
- WebSocket URL
- Feature flags
- Analytics setup
- Error tracking (Sentry)
- Environment-specific settings

**Config Options**:
```env
PUBLIC_API_URL=http://localhost:3000
PUBLIC_WEBSOCKET_URL=ws://localhost:3000
PUBLIC_ENV=development
PUBLIC_ENABLE_NOTIFICATIONS=true
PUBLIC_ENABLE_NEWSLETTER=true
PUBLIC_ENABLE_EXPERT_VERIFICATION=true
```

### 📝 Next Steps for Phase 6.1

**Immediate (Today)**:
1. Update all services (comments, bookmarks, qa, notifications) to use httpClient
2. Implement WebSocket connection in NotificationService
3. Add API configuration to astro.config.mjs
4. Create login/register components

**Short-term (This week)**:
1. Test all endpoints with real backend
2. Implement error toasts/notifications
3. Add loading states
4. Handle auth redirect flows
5. Test bookmark sync on login
6. Test comment approval notifications

**Testing Checklist**:
- [ ] User registration flow
- [ ] Email verification
- [ ] Login/logout
- [ ] Comment creation → moderation → approval
- [ ] Bookmark sync
- [ ] Q&A publishing
- [ ] Real-time notifications
- [ ] Newsletter subscription
- [ ] Activity tracking

### 🚀 Integration Status

```
Backend:     ✅ Complete (40 endpoints)
HTTP Client: ✅ Created
Auth Update: ✅ Updated to use HTTP client
Environment: ✅ Configured
Services:    ⏳ Ready to update
Components:  ⏳ Need integration
Testing:     ⏳ Integration testing
Deployment:  ⏳ Staging ready
```

### 📊 Files Created

- `src/lib/http-client.ts` (280 lines)
- `.env.example.frontend` (20 lines)
- `src/lib/auth.ts` (updated)

### 🎯 Phase 6.1 Scope

**This Phase**:
- ✅ Create HTTP client layer
- ✅ Update auth service
- ⏳ Update all other services
- ⏳ Implement real-time WebSocket
- ⏳ Integration testing
- ⏳ Staging deployment
- ⏳ Production deployment

**Timeline**: 1-2 weeks

---

## Command Reference

### Development
```bash
# Start frontend
npm run dev

# Start backend
cd backend && npm run dev

# Build frontend
npm run build
```

### Environment Setup
```bash
# Copy frontend env
cp .env.example.frontend .env.local

# Update with your backend URL
# LOCAL: http://localhost:3000
# STAGING: https://api-staging.downtogether.org
# PRODUCTION: https://api.downtogether.org
```

### Testing
```bash
# Test auth flow
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test","password":"TestPass123!"}'
```

---

## Next: Update All Services

All services (comments, bookmarks, qa, notifications) need to be updated to use httpClient for:
- Retry logic
- Error handling
- Token refresh
- Consistent API calls

Would you like me to continue updating the services?
