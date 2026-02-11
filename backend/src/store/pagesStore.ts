import type { IPagesStore } from "./interfaces";

export interface SchedulingPage {
  slug: string;
  calendarUrls: string[];
  ownerName: string;
  ownerEmail: string;
  bio?: string;
  defaultDurationMinutes: number;
  bufferMinutes: number;
  dateRangeDays: number;
  minNoticeHours: number;
  includeWeekends: boolean;
  createdAt: number;
  expiresAt: number;
}

export class InMemoryPagesStore implements IPagesStore {
  private pages = new Map<string, SchedulingPage>();

  async create(page: SchedulingPage): Promise<SchedulingPage> {
    this.pages.set(page.slug, page);
    return page;
  }

  async get(slug: string): Promise<SchedulingPage | undefined> {
    const page = this.pages.get(slug);
    if (!page) return undefined;
    if (Date.now() >= page.expiresAt) {
      this.pages.delete(slug);
      return undefined;
    }
    return page;
  }

  async getPageId(slug: string): Promise<string | null> {
    const page = await this.get(slug);
    return page ? slug : null;
  }

  async purgeExpired(): Promise<void> {
    const now = Date.now();
    for (const [slug, page] of this.pages.entries()) {
      if (now >= page.expiresAt) {
        this.pages.delete(slug);
      }
    }
  }
}
