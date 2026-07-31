/**
 * PHASE 6: API Types + Endpoints
 * Type definitions for all API endpoints
 */

// Comment types
export interface CommentCreateRequest {
  article_id: string;
  content: string;
  parent_comment_id?: string;
}

export interface CommentResponse {
  id: string;
  article_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

// Bookmark types
export interface BookmarkCreateRequest {
  article_id: string;
  article_title: string;
  article_url: string;
}

export interface BookmarkResponse {
  id: string;
  user_id: string;
  article_id: string;
  article_title: string;
  article_url: string;
  created_at: string;
}

// Expert Q&A types
export interface ExpertQACreateRequest {
  question: string;
  category: string;
  content: string;
}

export interface ExpertQAResponse {
  id: string;
  question: string;
  answer: string;
  expert_id: string;
  expert_name: string;
  expert_credentials: string[];
  category: string;
  views_count: number;
  helpful_count: number;
  created_at: string;
  published: boolean;
}

// Expert verification types
export interface ExpertVerificationRequest {
  credentials: string;
  specialty: string;
  years_experience: number;
  bio: string;
}

export interface ExpertVerificationResponse {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  verified_at?: string;
  created_at: string;
}

// Moderation types
export interface ModerationAction {
  comment_id: string;
  action: "approved" | "rejected" | "flagged" | "removed";
  reason?: string;
}

export interface ModerationLogResponse {
  id: string;
  comment_id: string;
  moderator_id: string;
  action: string;
  reason?: string;
  created_at: string;
}

// Notification types
export interface NotificationResponse {
  id: string;
  user_id: string;
  type: "comment_reply" | "comment_like" | "newsletter" | "qa_answer" | "expert_verified";
  title: string;
  message?: string;
  link?: string;
  read: boolean;
  created_at: string;
}

// Newsletter types
export interface NewsletterSubscribeRequest {
  email: string;
  category?: "all" | "health" | "education" | "legal" | "weekly_digest";
}

export interface NewsletterSubscribeResponse {
  success: boolean;
  message: string;
  subscription_id?: string;
}

// User activity types
export interface UserActivityCreateRequest {
  activity_type: "article_read" | "comment_posted" | "bookmark_saved" | "qa_viewed" | "shared";
  article_id?: string;
  metadata?: Record<string, unknown>;
}

// API endpoint structure
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    REFRESH: "/api/auth/refresh",
    OAUTH: "/api/auth/oauth",
  },

  // Comments
  COMMENTS: {
    CREATE: "/api/comments",
    GET_ARTICLE: "/api/comments/article/:articleId",
    GET_ONE: "/api/comments/:commentId",
    UPDATE: "/api/comments/:commentId",
    DELETE: "/api/comments/:commentId",
    LIKE: "/api/comments/:commentId/like",
    MODERATE: "/api/comments/:commentId/moderate",
  },

  // Bookmarks
  BOOKMARKS: {
    CREATE: "/api/bookmarks",
    GET_USER: "/api/bookmarks/user",
    GET_ONE: "/api/bookmarks/:bookmarkId",
    DELETE: "/api/bookmarks/:bookmarkId",
  },

  // Expert Q&A
  QA: {
    CREATE: "/api/qa",
    GET_ALL: "/api/qa",
    GET_ONE: "/api/qa/:qaId",
    UPDATE: "/api/qa/:qaId",
    GET_BY_EXPERT: "/api/qa/expert/:expertId",
    MARK_HELPFUL: "/api/qa/:qaId/helpful",
    PUBLISH: "/api/qa/:qaId/publish",
  },

  // Expert verification
  EXPERT: {
    REQUEST_VERIFICATION: "/api/expert/verify",
    GET_REQUESTS: "/api/expert/verify/requests",
    APPROVE: "/api/expert/verify/:requestId/approve",
    REJECT: "/api/expert/verify/:requestId/reject",
  },

  // Moderation
  MODERATION: {
    GET_PENDING: "/api/moderation/pending",
    ACTION: "/api/moderation/action",
    GET_LOG: "/api/moderation/log",
  },

  // Notifications
  NOTIFICATIONS: {
    GET_USER: "/api/notifications",
    MARK_READ: "/api/notifications/:notificationId/read",
    DELETE: "/api/notifications/:notificationId",
  },

  // Newsletter
  NEWSLETTER: {
    SUBSCRIBE: "/api/newsletter/subscribe",
    UNSUBSCRIBE: "/api/newsletter/unsubscribe",
  },

  // User activity
  ACTIVITY: {
    TRACK: "/api/activity",
    GET_USER: "/api/activity/user",
  },

  // Users
  USERS: {
    GET_PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
    GET_PUBLIC: "/api/users/:userId",
  },
};
