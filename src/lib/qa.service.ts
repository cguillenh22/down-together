/**
 * PHASE 6: Expert Q&A System Service
 * Uses httpClient for retry logic + error handling
 */

import { httpClient } from "./http-client";
import type { ExpertQAResponse, ExpertQACreateRequest } from "./api.types";
import { API_ENDPOINTS } from "./api.types";

export class ExpertQAService {
  private qa_cache: Map<string, ExpertQAResponse> = new Map();
  private observers: Set<(qa: ExpertQAResponse[]) => void> = new Set();

  async getAllQA(): Promise<ExpertQAResponse[]> {
    const response = await httpClient.get<{ qa: ExpertQAResponse[] }>(
      API_ENDPOINTS.QA.GET_ALL
    );

    if (response.success && response.data?.qa) {
      response.data.qa.forEach((q) => this.qa_cache.set(q.id, q));
      return response.data.qa;
    }

    console.error("Failed to fetch Q&A:", response.error);
    return [];
  }

  async getQAByCategory(category: string): Promise<ExpertQAResponse[]> {
    const all = await this.getAllQA();
    return all.filter((q) => q.category === category);
  }

  async getQAByExpert(expertId: string): Promise<ExpertQAResponse[]> {
    const url = API_ENDPOINTS.QA.GET_BY_EXPERT.replace(":expertId", expertId);
    const response = await httpClient.get<{ qa: ExpertQAResponse[] }>(url);

    if (response.success && response.data?.qa) {
      return response.data.qa;
    }

    console.error("Failed to fetch expert Q&A:", response.error);
    return [];
  }

  async submitQA(request: ExpertQACreateRequest): Promise<ExpertQAResponse | null> {
    const response = await httpClient.post<ExpertQAResponse>(
      API_ENDPOINTS.QA.CREATE,
      request
    );

    if (response.success && response.data) {
      this.qa_cache.set(response.data.id, response.data);
      this.notifyObservers();
      return response.data;
    }

    console.error("Failed to submit Q&A:", response.error);
    return null;
  }

  async markAsHelpful(qaId: string): Promise<boolean> {
    const url = API_ENDPOINTS.QA.MARK_HELPFUL.replace(":qaId", qaId);
    const response = await httpClient.post<ExpertQAResponse>(url);

    if (response.success && response.data) {
      this.qa_cache.set(response.data.id, response.data);
      this.notifyObservers();
      return true;
    }

    console.error("Failed to mark as helpful:", response.error);
    return false;
  }

  async publishQA(qaId: string): Promise<boolean> {
    const url = API_ENDPOINTS.QA.PUBLISH.replace(":qaId", qaId);
    const response = await httpClient.post<ExpertQAResponse>(url, { published: true });

    if (response.success && response.data) {
      this.qa_cache.set(response.data.id, response.data);
      this.notifyObservers();
      return true;
    }

    console.error("Failed to publish Q&A:", response.error);
    return false;
  }

  async requestExpertVerification(
    credentials: string,
    specialty: string,
    years: number,
    bio: string
  ): Promise<boolean> {
    const response = await httpClient.post(API_ENDPOINTS.EXPERT.REQUEST_VERIFICATION, {
      credentials,
      specialty,
      years_experience: years,
      bio,
    });

    return response.success;
  }

  async getPendingQA(): Promise<ExpertQAResponse[]> {
    const all = await this.getAllQA();
    return all.filter((q) => !q.published);
  }

  async updateQA(
    qaId: string,
    updates: Partial<ExpertQACreateRequest>
  ): Promise<ExpertQAResponse | null> {
    const url = API_ENDPOINTS.QA.UPDATE.replace(":qaId", qaId);
    const response = await httpClient.patch<ExpertQAResponse>(url, updates);

    if (response.success && response.data) {
      this.qa_cache.set(response.data.id, response.data);
      this.notifyObservers();
      return response.data;
    }

    console.error("Failed to update Q&A:", response.error);
    return null;
  }

  searchQA(query: string): ExpertQAResponse[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.qa_cache.values()).filter(
      (q) =>
        q.question.toLowerCase().includes(searchTerm) ||
        q.answer.toLowerCase().includes(searchTerm) ||
        q.category.toLowerCase().includes(searchTerm)
    );
  }

  subscribe(callback: (qa: ExpertQAResponse[]) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    const qa = Array.from(this.qa_cache.values());
    this.observers.forEach((cb) => cb(qa));
  }

  getQAStats(): {
    total: number;
    published: number;
    pending: number;
    helpful_avg: number;
  } {
    const all = Array.from(this.qa_cache.values());
    const published = all.filter((q) => q.published);
    const helpful = all.reduce((sum, q) => sum + q.helpful_count, 0);

    return {
      total: all.length,
      published: published.length,
      pending: all.length - published.length,
      helpful_avg: all.length > 0 ? helpful / all.length : 0,
    };
  }
}

export const qaService = new ExpertQAService();
