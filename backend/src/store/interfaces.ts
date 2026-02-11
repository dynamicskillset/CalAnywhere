import type { SchedulingPage } from "./pagesStore";
import type { PendingRequest } from "./pendingRequestsStore";

export type { SchedulingPage, PendingRequest };

export interface Booking {
  id: string;
  pageId: string;
  requesterName: string;
  requesterEmail: string;
  reason: string;
  notes?: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  createdAt: string;
}

export interface IPagesStore {
  create(page: SchedulingPage): Promise<SchedulingPage>;
  get(slug: string): Promise<SchedulingPage | undefined>;
  getPageId(slug: string): Promise<string | null>;
  purgeExpired(): Promise<void>;
}

export interface IPendingRequestsStore {
  create(data: Omit<PendingRequest, "token" | "createdAt">): Promise<PendingRequest>;
  get(token: string): Promise<PendingRequest | undefined>;
  getAndDelete(token: string): Promise<PendingRequest | undefined>;
  delete(token: string): Promise<void>;
  purgeExpired(): Promise<void>;
}

export interface IBookingsStore {
  create(booking: Omit<Booking, "id" | "createdAt">): Promise<Booking>;
}
