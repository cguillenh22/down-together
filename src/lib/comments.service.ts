/**
 * PHASE 6: Comment System Service
 * Uses httpClient for retry logic + error handling
 */

import { httpClient } from "./http-client";
import type { CommentResponse, CommentCreateRequest } from "./api.types";
import { API_ENDPOINTS } from "./api.types";

export class CommentService {
  private observers: Set<(comments: CommentResponse[]) => void> = new Set();

  async createComment(request: CommentCreateRequest): Promise<CommentResponse | null> {
    const response = await httpClient.post<CommentResponse>(
      API_ENDPOINTS.COMMENTS.CREATE,
      request
    );

    if (response.success) {
      this.notifyObservers();
      return response.data || null;
    }

    console.error("Create comment failed:", response.error);
    return null;
  }

  async getArticleComments(articleId: string): Promise<CommentResponse[]> {
    const url = API_ENDPOINTS.COMMENTS.GET_ARTICLE.replace(":articleId", articleId);
    const response = await httpClient.get<CommentResponse[]>(url);

    if (response.success && response.data) {
      return response.data;
    }

    console.error("Get comments failed:", response.error);
    return [];
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const url = API_ENDPOINTS.COMMENTS.DELETE.replace(":commentId", commentId);
    const response = await httpClient.delete(url);

    if (response.success) {
      this.notifyObservers();
      return true;
    }

    console.error("Delete comment failed:", response.error);
    return false;
  }

  async likeComment(commentId: string): Promise<boolean> {
    const url = API_ENDPOINTS.COMMENTS.LIKE.replace(":commentId", commentId);
    const response = await httpClient.post(url);

    if (response.success) {
      this.notifyObservers();
      return true;
    }

    console.error("Like comment failed:", response.error);
    return false;
  }

  async getPendingComments(): Promise<CommentResponse[]> {
    const response = await httpClient.get<CommentResponse[]>(
      API_ENDPOINTS.MODERATION.GET_PENDING
    );

    if (response.success && response.data) {
      return response.data;
    }

    console.error("Get pending comments failed:", response.error);
    return [];
  }

  async moderateComment(
    commentId: string,
    action: "approved" | "rejected" | "flagged" | "removed",
    reason?: string
  ): Promise<boolean> {
    const url = API_ENDPOINTS.COMMENTS.MODERATE.replace(":commentId", commentId);
    const response = await httpClient.post(url, { action, reason });

    if (response.success) {
      this.notifyObservers();
      return true;
    }

    console.error("Moderate comment failed:", response.error);
    return false;
  }

  async flagComment(commentId: string, reason: string): Promise<boolean> {
    return this.moderateComment(commentId, "flagged", reason);
  }

  async getComment(commentId: string): Promise<CommentResponse | null> {
    const url = API_ENDPOINTS.COMMENTS.GET_ONE.replace(":commentId", commentId);
    const response = await httpClient.get<CommentResponse>(url);

    if (response.success && response.data) {
      return response.data;
    }

    console.error("Get comment failed:", response.error);
    return null;
  }

  subscribe(callback: (comments: CommentResponse[]) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach((cb) => cb([]));
  }
}

export const commentService = new CommentService();
