import { randomUUID } from "crypto";
import type { IPendingRequestsStore } from "./interfaces";

export interface PendingRequest {
  token: string;
  slug: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  notes?: string;
  startIso: string;
  endIso: string;
  timezone?: string;
  createdAt: number;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour

export class InMemoryPendingRequestsStore implements IPendingRequestsStore {
  private requests = new Map<string, PendingRequest>();

  async create(
    data: Omit<PendingRequest, "token" | "createdAt">
  ): Promise<PendingRequest> {
    const token = randomUUID();
    const request: PendingRequest = {
      ...data,
      token,
      createdAt: Date.now()
    };
    this.requests.set(token, request);
    return request;
  }

  async get(token: string): Promise<PendingRequest | undefined> {
    const request = this.requests.get(token);
    if (!request) return undefined;
    if (Date.now() - request.createdAt > TTL_MS) {
      this.requests.delete(token);
      return undefined;
    }
    return request;
  }

  async getAndDelete(token: string): Promise<PendingRequest | undefined> {
    const request = await this.get(token);
    if (request) {
      this.requests.delete(token);
    }
    return request;
  }

  async delete(token: string): Promise<void> {
    this.requests.delete(token);
  }

  async purgeExpired(): Promise<void> {
    const now = Date.now();
    for (const [token, request] of this.requests.entries()) {
      if (now - request.createdAt > TTL_MS) {
        this.requests.delete(token);
      }
    }
  }
}
