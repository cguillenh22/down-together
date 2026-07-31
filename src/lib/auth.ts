/**
 * PHASE 6: Authentication System
 * Backend-ready auth layer with JWT support
 * Uses HTTP client for retry logic + error handling
 */

import { httpClient } from './http-client';

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: "member" | "expert" | "moderator" | "admin";
  verified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: AuthToken;
  error?: string;
}

export class AuthService {
  private tokenKey = "downtogether_auth_token";
  private refreshTokenKey = "downtogether_refresh_token";

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>("/api/auth/login", {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      this.setTokens(response.data.token);
    }

    return response.data || { success: false, error: response.error };
  }

  async register(email: string, name: string, password: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>("/api/auth/register", {
      email,
      name,
      password,
    });

    if (response.success && response.data?.token) {
      this.setTokens(response.data.token);
    }

    return response.data || { success: false, error: response.error };
  }

  async oauthLogin(provider: "google" | "github"): Promise<AuthResponse> {
    window.location.href = `${httpClient.getBaseUrl()}/api/auth/oauth/${provider}`;
    return { success: false };
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);

    await httpClient.post("/api/auth/logout");
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      return { success: false, error: "No refresh token" };
    }

    const response = await httpClient.post<AuthResponse>("/api/auth/refresh", {
      refresh_token: refreshToken,
    });

    if (response.success && response.data?.token) {
      this.setTokens(response.data.token);
    }

    return response.data || { success: false, error: response.error };
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private setTokens(token: AuthToken): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.tokenKey, token.access_token);
    localStorage.setItem(this.refreshTokenKey, token.refresh_token);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): { id: string; email: string; role: string } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
