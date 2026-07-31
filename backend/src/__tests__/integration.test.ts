import request from 'supertest';
import { createServer } from 'http';
import express from 'express';

/**
 * Integration Tests
 * Tests complete user flows
 */

describe('Integration Tests', () => {
  let app: any;
  let server: any;
  let authToken: string;
  let userId: string;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    server = createServer(app);
  });

  afterAll(() => {
    server.close();
  });

  describe('Auth Flow', () => {
    it('should complete full auth flow: register → login → refresh → logout', async () => {
      // Step 1: Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'integration-test@example.com',
          name: 'Integration Test User',
          password: 'TestPassword123!',
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.user.email).toBe('integration-test@example.com');
      expect(registerRes.body.token).toBeDefined();

      authToken = registerRes.body.token.access_token;
      userId = registerRes.body.user.id;

      // Step 2: Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'integration-test@example.com',
          password: 'TestPassword123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.token).toBeDefined();

      const newAuthToken = loginRes.body.token.access_token;
      const refreshToken = loginRes.body.token.refresh_token;

      // Step 3: Refresh token
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({
          refresh_token: refreshToken,
        });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.token.access_token).toBeDefined();

      // Step 4: Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAuthToken}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });

  describe('Comment Flow', () => {
    it('should complete comment workflow: create → moderate → approve', async () => {
      // Setup: Create user
      let token = '';
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'commenter@example.com',
          name: 'Commenter',
          password: 'TestPass123!',
        });

      token = userRes.body.token.access_token;
      const commenterId = userRes.body.user.id;

      // Step 1: Create comment (pending)
      const createRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          article_id: 'health-101',
          content: 'This is a great article about Down syndrome!',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('pending');
      const commentId = createRes.body.id;

      // Step 2: Get pending comments (as moderator)
      const pendingRes = await request(app)
        .get('/api/moderation/pending')
        .set('Authorization', `Bearer ${token}`);

      // Step 3: Moderate comment (approve)
      const moderateRes = await request(app)
        .post(`/api/comments/${commentId}/moderate`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          action: 'approved',
        });

      expect(moderateRes.status).toBe(200);
      expect(moderateRes.body.success).toBe(true);

      // Step 4: Verify comment is now visible
      const getRes = await request(app)
        .get('/api/comments/health-101');

      expect(getRes.status).toBe(200);
      expect(getRes.body.comments.length).toBeGreaterThan(0);
    });
  });

  describe('Bookmark Flow', () => {
    it('should sync bookmarks from localStorage on login', async () => {
      // Step 1: Create user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'bookmarker@example.com',
          name: 'Bookmarker',
          password: 'TestPass123!',
        });

      const token = userRes.body.token.access_token;

      // Step 2: Add bookmark
      const addRes = await request(app)
        .post('/api/bookmarks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          article_id: 'health-101',
          article_title: 'Health Basics',
          article_url: 'https://example.com/health-101',
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.article_id).toBe('health-101');

      // Step 3: Get bookmarks
      const listRes = await request(app)
        .get('/api/bookmarks/user')
        .set('Authorization', `Bearer ${token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.bookmarks.length).toBeGreaterThan(0);

      // Step 4: Sync bookmarks (login scenario)
      const syncRes = await request(app)
        .post('/api/bookmarks/sync')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookmarks: [
            {
              article_id: 'education-101',
              article_title: 'Education Guide',
              article_url: 'https://example.com/education-101',
            },
            {
              article_id: 'legal-101',
              article_title: 'Legal Guide',
              article_url: 'https://example.com/legal-101',
            },
          ],
        });

      expect(syncRes.status).toBe(200);
      expect(syncRes.body.synced).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Expert Q&A Flow', () => {
    it('should complete expert flow: verify → create Q&A → publish → vote', async () => {
      // Step 1: Register expert user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'expert@example.com',
          name: 'Dr. Expert',
          password: 'ExpertPass123!',
        });

      const token = userRes.body.token.access_token;
      const expertId = userRes.body.user.id;

      // Step 2: Request expert verification
      const verifyRes = await request(app)
        .post('/api/expert/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({
          credentials: 'MD from Stanford Medical School, 15 years experience in pediatric care',
          specialty: 'Pediatric Down Syndrome Care',
          years_experience: 15,
          bio: 'Passionate about helping families navigate Down syndrome care',
        });

      expect(verifyRes.status).toBe(201);
      expect(verifyRes.body.status).toBe('pending');

      // Step 3: Approve verification (as admin)
      // Note: Would need admin token in real scenario
      const approveRes = await request(app)
        .post('/api/expert/verify/:verifyId/approve')
        .set('Authorization', `Bearer ${token}`)
        .send({
          approved: true,
        });

      // Step 4: Create Q&A (only if verified)
      const qaRes = await request(app)
        .post('/api/qa')
        .set('Authorization', `Bearer ${token}`)
        .send({
          question: 'What are the key developmental milestones for children with Down syndrome?',
          answer: 'Children with Down syndrome reach developmental milestones at their own pace. Early intervention is crucial...',
          category: 'health',
        });

      expect(qaRes.status).toBe(403); // Forbidden until approved
    });
  });

  describe('Notification Flow', () => {
    it('should manage notifications: subscribe → receive → mark read', async () => {
      // Step 1: Subscribe to newsletter
      const subRes = await request(app)
        .post('/api/notifications/newsletter/subscribe')
        .send({
          email: 'subscriber@example.com',
          category: 'health',
        });

      expect(subRes.status).toBe(201);
      expect(subRes.body.success).toBe(true);

      // Step 2: Get notifications (authenticated user)
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'notified@example.com',
          name: 'Notified User',
          password: 'TestPass123!',
        });

      const token = userRes.body.token.access_token;

      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(notifRes.status).toBe(200);
      expect(notifRes.body.notifications).toBeDefined();
      expect(notifRes.body.unread_count).toBeDefined();

      // Step 3: Mark as read (if notifications exist)
      if (notifRes.body.notifications.length > 0) {
        const notifId = notifRes.body.notifications[0].id;
        const readRes = await request(app)
          .post(`/api/notifications/${notifId}/read`)
          .set('Authorization', `Bearer ${token}`);

        expect(readRes.status).toBe(200);
        expect(readRes.body.success).toBe(true);
      }
    });
  });

  describe('Activity Tracking', () => {
    it('should track user activities and generate analytics', async () => {
      // Step 1: Register user
      const userRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'active@example.com',
          name: 'Active User',
          password: 'TestPass123!',
        });

      const token = userRes.body.token.access_token;

      // Step 2: Track activities
      const trackRes = await request(app)
        .post('/api/activity')
        .set('Authorization', `Bearer ${token}`)
        .send({
          activity_type: 'article_read',
          article_id: 'health-101',
          metadata: { time_on_page: 120 },
        });

      expect(trackRes.status).toBe(200);
      expect(trackRes.body.activity_type).toBe('article_read');

      // Step 3: Get user activity
      const activityRes = await request(app)
        .get('/api/activity')
        .set('Authorization', `Bearer ${token}`);

      expect(activityRes.status).toBe(200);
      expect(activityRes.body.activities).toBeDefined();
    });
  });
});
