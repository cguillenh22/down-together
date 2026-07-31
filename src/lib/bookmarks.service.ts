/**
 * PHASE 6: Bookmark System Service
 * Uses httpClient for retry logic + localStorage fallback
 */

import { httpClient } from "./http-client";
import { authService } from "./auth";
import type { BookmarkResponse, BookmarkCreateRequest } from "./api.types";
import { API_ENDPOINTS } from "./api.types";

interface LocalBookmark extends BookmarkCreateRequest {
  id: string;
  created_at: string;
}

export class BookmarkService {
  private localKey = "downtogether_bookmarks";
  private bookmarks: Map<string, BookmarkResponse> = new Map();
  private observers: Set<(bookmarks: BookmarkResponse[]) => void> = new Set();

  async loadBookmarks(): Promise<BookmarkResponse[]> {
    if (!authService.isAuthenticated()) {
      return this.loadLocalBookmarks();
    }

    const response = await httpClient.get<{ bookmarks: BookmarkResponse[] }>(
      API_ENDPOINTS.BOOKMARKS.GET_USER
    );

    if (response.success && response.data?.bookmarks) {
      response.data.bookmarks.forEach((b) => this.bookmarks.set(b.id, b));
      this.notifyObservers();
      return response.data.bookmarks;
    }

    console.error("Failed to fetch bookmarks:", response.error);
    return this.loadLocalBookmarks();
  }

  async addBookmark(request: BookmarkCreateRequest): Promise<BookmarkResponse | null> {
    if (!authService.isAuthenticated()) {
      return this.addLocalBookmark(request);
    }

    const response = await httpClient.post<BookmarkResponse>(
      API_ENDPOINTS.BOOKMARKS.CREATE,
      request
    );

    if (response.success && response.data) {
      this.bookmarks.set(response.data.id, response.data);
      this.notifyObservers();
      return response.data;
    }

    if (response.error?.includes("409")) {
      console.warn("Bookmark already exists");
      return null;
    }

    console.error("Failed to add bookmark:", response.error);
    return this.addLocalBookmark(request);
  }

  async removeBookmark(bookmarkId: string): Promise<boolean> {
    if (!authService.isAuthenticated()) {
      return this.removeLocalBookmark(bookmarkId);
    }

    const url = API_ENDPOINTS.BOOKMARKS.DELETE.replace(":bookmarkId", bookmarkId);
    const response = await httpClient.delete(url);

    if (response.success) {
      this.bookmarks.delete(bookmarkId);
      this.notifyObservers();
      return true;
    }

    console.error("Failed to remove bookmark:", response.error);
    return this.removeLocalBookmark(bookmarkId);
  }

  isBookmarked(articleId: string): boolean {
    return Array.from(this.bookmarks.values()).some((b) => b.article_id === articleId);
  }

  getBookmarks(): BookmarkResponse[] {
    return Array.from(this.bookmarks.values());
  }

  private loadLocalBookmarks(): BookmarkResponse[] {
    try {
      if (typeof window === 'undefined') return [];
      const data = localStorage.getItem(this.localKey);
      if (!data) return [];

      const local = JSON.parse(data) as LocalBookmark[];
      return local.map((b) => ({
        id: b.id,
        user_id: "local",
        article_id: b.article_id,
        article_title: b.article_title,
        article_url: b.article_url,
        created_at: b.created_at,
      }));
    } catch (error) {
      console.error("Failed to load local bookmarks:", error);
      return [];
    }
  }

  private addLocalBookmark(request: BookmarkCreateRequest): BookmarkResponse {
    const id = crypto.randomUUID();
    const bookmark: LocalBookmark = {
      ...request,
      id,
      created_at: new Date().toISOString(),
    };

    const current = this.loadLocalBookmarks();
    const local = [
      ...current.map((b) => ({
        article_id: b.article_id,
        article_title: b.article_title,
        article_url: b.article_url,
        id: b.id,
        created_at: b.created_at,
      })),
      bookmark,
    ];

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.localKey, JSON.stringify(local));
    }

    this.bookmarks.set(id, {
      id,
      user_id: "local",
      ...request,
      created_at: bookmark.created_at,
    });

    this.notifyObservers();
    return this.bookmarks.get(id)!;
  }

  private removeLocalBookmark(bookmarkId: string): boolean {
    const current = this.loadLocalBookmarks();
    const updated = current.filter((b) => b.id !== bookmarkId);

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        this.localKey,
        JSON.stringify(
          updated.map((b) => ({
            article_id: b.article_id,
            article_title: b.article_title,
            article_url: b.article_url,
            id: b.id,
            created_at: b.created_at,
          }))
        )
      );
    }

    this.bookmarks.delete(bookmarkId);
    this.notifyObservers();
    return true;
  }

  subscribe(callback: (bookmarks: BookmarkResponse[]) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    const bookmarks = Array.from(this.bookmarks.values());
    this.observers.forEach((cb) => cb(bookmarks));
  }

  async syncLocalBookmarks(): Promise<void> {
    if (!authService.isAuthenticated()) {
      return;
    }

    const local = this.loadLocalBookmarks();
    for (const bookmark of local) {
      try {
        await this.addBookmark({
          article_id: bookmark.article_id,
          article_title: bookmark.article_title,
          article_url: bookmark.article_url,
        });
      } catch (error) {
        console.error(`Failed to sync bookmark ${bookmark.id}:`, error);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.localKey);
    }
  }
}

export const bookmarkService = new BookmarkService();
