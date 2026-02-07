import { randomUUID } from "crypto";

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

class InMemoryPendingRequestsStore {
  private requests = new Map<string, PendingRequest>();

  create(
    data: Omit<PendingRequest, "token" | "createdAt">
  ): PendingRequest {
    const token = randomUUID();
    const request: PendingRequest = {
      ...data,
      token,
      createdAt: Date.now()
    };
    this.requests.set(token, request);
    return request;
  }

  get(token: string): PendingRequest | undefined {
    const request = this.requests.get(token);
    if (!request) return undefined;
    if (Date.now() - request.createdAt > TTL_MS) {
      this.requests.delete(token);
      return undefined;
    }
    return request;
  }

  delete(token: string): void {
    this.requests.delete(token);
  }

  purgeExpired(): void {
    const now = Date.now();
    for (const [token, request] of this.requests.entries()) {
      if (now - request.createdAt > TTL_MS) {
        this.requests.delete(token);
      }
    }
  }
}

export const pendingRequestsStore = new InMemoryPendingRequestsStore();

// Purge expired requests every 5 minutes
setInterval(() => {
  pendingRequestsStore.purgeExpired();
}, 5 * 60 * 1000);
