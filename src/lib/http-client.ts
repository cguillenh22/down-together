/**
 * HTTP Client for Backend Integration
 * Handles all API requests with auth, error handling, retry logic
 */

import { authService } from './auth';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  headers?: Record<string, string>;
  body?: any;
  retries?: number;
  timeout?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class HttpClient {
  private baseUrl: string;
  private timeout: number = 30000;
  private retries: number = 3;

  constructor() {
    this.baseUrl = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
  }

  /**
   * Get authorization headers
   */
  private getHeaders(config?: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config?.headers,
    };

    const token = authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Main request method with retry logic
   */
  async request<T>(
    path: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      retries = this.retries,
      timeout = this.timeout,
    } = config;

    const url = `${this.baseUrl}${path}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers: this.getHeaders(config),
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 - Token expired, try refresh
        if (response.status === 401 && attempt < retries) {
          console.log('Token expired, attempting refresh...');
          const refreshed = await authService.refreshToken();
          if (refreshed.success) {
            continue; // Retry with new token
          } else {
            // Redirect to login
            window.location.href = '/login';
            return { success: false, error: 'Authentication required' };
          }
        }

        // Handle other errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: errorData.error || response.statusText,
            message: errorData.message,
          };
        }

        const data = await response.json();

        // Handle API response format
        if (data.success === false) {
          return {
            success: false,
            error: data.error,
            message: data.message,
          };
        }

        return {
          success: true,
          data: data.data || data,
        };
      } catch (error) {
        lastError = error as Error;

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            lastError = new Error('Request timeout');
          }
        }

        // Retry if not last attempt
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Request failed after retries',
    };
  }

  /**
   * Convenience methods
   */
  async get<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'GET' });
  }

  async post<T>(
    path: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'POST', body });
  }

  async patch<T>(
    path: string,
    body?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'PATCH', body });
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...config, method: 'DELETE' });
  }

  /**
   * Upload file (multipart/form-data)
   */
  async uploadFile<T>(
    path: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    try {
      const url = `${this.baseUrl}${path}`;
      const headers: Record<string, string> = {};

      const token = authService.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        return {
          success: false,
          error: response.statusText,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get base URL (for custom requests)
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Set base URL (for multi-environment support)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }
}

export const httpClient = new HttpClient();
