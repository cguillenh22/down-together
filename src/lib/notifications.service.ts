/**
 * PHASE 6: Notification System Service
 * Real-time notifications with WebSocket support
 */

import { httpClient } from "./http-client";
import type { NotificationResponse, NewsletterSubscribeRequest } from "./api.types";
import { API_ENDPOINTS } from "./api.types";

export class NotificationService {
  private notifications: Map<string, NotificationResponse> = new Map();
  private observers: Set<(notifications: NotificationResponse[]) => void> = new Set();
  private websocket: WebSocket | null = null;

  async loadNotifications(): Promise<NotificationResponse[]> {
    const response = await httpClient.get<{
      notifications: NotificationResponse[];
      unread_count: number;
    }>(API_ENDPOINTS.NOTIFICATIONS.GET_USER);

    if (response.success && response.data?.notifications) {
      response.data.notifications.forEach((n) => this.notifications.set(n.id, n));
      this.notifyObservers();
      return response.data.notifications;
    }

    console.error("Failed to load notifications:", response.error);
    return [];
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    const url = API_ENDPOINTS.NOTIFICATIONS.MARK_READ.replace(
      ":notificationId",
      notificationId
    );
    const response = await httpClient.post(url);

    if (response.success) {
      const notification = this.notifications.get(notificationId);
      if (notification) {
        notification.read = true;
        this.notifyObservers();
      }
      return true;
    }

    console.error("Failed to mark notification as read:", response.error);
    return false;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    const url = API_ENDPOINTS.NOTIFICATIONS.DELETE.replace(
      ":notificationId",
      notificationId
    );
    const response = await httpClient.delete(url);

    if (response.success) {
      this.notifications.delete(notificationId);
      this.notifyObservers();
      return true;
    }

    console.error("Failed to delete notification:", response.error);
    return false;
  }

  connectWebSocket(): void {
    if (this.websocket) {
      return;
    }

    try {
      const protocol = typeof window !== 'undefined' && window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${typeof window !== 'undefined' ? window.location.host : 'localhost:3000'}/ws`;

      const token = localStorage.getItem("downtogether_auth_token");
      if (!token) {
        console.warn("No token found for WebSocket connection");
        return;
      }

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log("WebSocket connected");
        // Send auth token
        this.websocket?.send(JSON.stringify({ type: "auth", token }));
      };

      this.websocket.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data) as NotificationResponse;
          this.notifications.set(notification.id, notification);
          this.notifyObservers();
          this.showBrowserNotification(notification);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.websocket.onclose = () => {
        console.log("WebSocket disconnected, reconnecting in 5s");
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.websocket?.close();
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  }

  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  getUnreadCount(): number {
    return Array.from(this.notifications.values()).filter((n) => !n.read).length;
  }

  getNotifications(): NotificationResponse[] {
    return Array.from(this.notifications.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async subscribeNewsletter(request: NewsletterSubscribeRequest): Promise<boolean> {
    const response = await httpClient.post(API_ENDPOINTS.NEWSLETTER.SUBSCRIBE, request);
    return response.success;
  }

  async unsubscribeNewsletter(email: string): Promise<boolean> {
    const response = await httpClient.post(API_ENDPOINTS.NEWSLETTER.UNSUBSCRIBE, {
      email,
    });
    return response.success;
  }

  private async showBrowserNotification(notification: NotificationResponse): Promise<void> {
    if (typeof window === 'undefined' || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.png",
        tag: notification.id,
        requireInteraction: false,
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
          tag: notification.id,
        });
      }
    }
  }

  subscribe(callback: (notifications: NotificationResponse[]) => void): () => void {
    this.observers.add(callback);
    callback(this.getNotifications());
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    const notifications = this.getNotifications();
    this.observers.forEach((cb) => cb(notifications));
  }

  async markAllAsRead(): Promise<boolean> {
    const unread = Array.from(this.notifications.values()).filter((n) => !n.read);

    for (const notification of unread) {
      await this.markAsRead(notification.id);
    }

    return true;
  }

  getByType(type: string): NotificationResponse[] {
    return Array.from(this.notifications.values()).filter((n) => n.type === type);
  }
}

export const notificationService = new NotificationService();
