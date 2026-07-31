# Down Together Backend API

Phase 6: Community Platform Backend

## Quick Start

### 1. Setup

```bash
npm install
cp .env.example .env
```

Configure `.env` with your database and email settings:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/downtogether"
JWT_SECRET="your-secret-key"
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 2. Database

```bash
# Run migrations
npx prisma migrate deploy

# Seed test data (optional)
npm run seed
```

### 3. Development

```bash
npm run dev
```

Server starts at `http://localhost:3000`

API docs at `http://localhost:3000/health`

## Endpoints Implemented

### Authentication
- ✅ `POST /api/auth/register` — Create account
- ✅ `POST /api/auth/login` — Login
- ✅ `POST /api/auth/refresh` — Refresh token
- ✅ `POST /api/auth/logout` — Logout
- ✅ `GET /api/auth/verify-email?token=...` — Verify email

## Architecture

```
src/
├── config/          # Environment + config
├── middleware/      # Express middleware (auth)
├── controllers/     # Business logic (auth)
├── services/        # External services (email)
├── routes/          # API routes
└── server.ts        # Express + Socket.io setup

prisma/
├── schema.prisma    # Data model
└── migrations/      # Database migrations
```

## Testing

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "Password123!"
  }'
```

## Next: Comments System

Implementation continues with:
1. Comment CRUD endpoints
2. Moderation system
3. Bookmark service
4. Expert Q&A
5. Notifications

See `../IMPLEMENTATION_CHECKLIST.md` for full roadmap.

## Troubleshooting

### Database connection error
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Run `psql $DATABASE_URL` to test connection

### Email not sending
- Verify SMTP credentials in `.env`
- For Gmail: Use app password, not account password
- Check email logs: `npm run logs:email`

### Migration failed
- Check Prisma schema matches database
- Run: `npx prisma db push --force-reset` (caution: loses data)

## Production Deployment

```bash
npm run build
npm start
```

Set `NODE_ENV=production` in `.env`

Configure monitoring:
- Sentry for error tracking
- DataDog for performance
- Redis for caching (optional)

## API Documentation

Full documentation in `../API_IMPLEMENTATION_GUIDE.md`
