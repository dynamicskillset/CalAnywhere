import type { Pool } from "pg";
import { randomUUID } from "crypto";
import type { IPendingRequestsStore } from "./interfaces";
import type { PendingRequest } from "./pendingRequestsStore";

const TTL_MS = 60 * 60 * 1000; // 1 hour

export class PgPendingRequestsStore implements IPendingRequestsStore {
  constructor(private pool: Pool) {}

  async create(
    data: Omit<PendingRequest, "token" | "createdAt">
  ): Promise<PendingRequest> {
    const token = randomUUID();
    const now = Date.now();
    const expiresAt = new Date(now + TTL_MS).toISOString();

    await this.pool.query(
      `INSERT INTO pending_requests
         (token, page_slug, requester_name, requester_email,
          reason, notes, start_iso, end_iso, timezone, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        token,
        data.slug,
        data.requesterName,
        data.requesterEmail,
        data.reason,
        data.notes || null,
        data.startIso,
        data.endIso,
        data.timezone || null,
        expiresAt,
      ]
    );

    return { ...data, token, createdAt: now };
  }

  async get(token: string): Promise<PendingRequest | undefined> {
    const result = await this.pool.query(
      `SELECT token, page_slug, requester_name, requester_email,
              reason, notes, start_iso, end_iso, timezone, created_at
       FROM pending_requests
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) return undefined;
    return this.rowToRequest(result.rows[0]);
  }

  async getAndDelete(token: string): Promise<PendingRequest | undefined> {
    const result = await this.pool.query(
      `DELETE FROM pending_requests
       WHERE token = $1 AND expires_at > NOW()
       RETURNING token, page_slug, requester_name, requester_email,
                 reason, notes, start_iso, end_iso, timezone, created_at`,
      [token]
    );

    if (result.rows.length === 0) return undefined;
    return this.rowToRequest(result.rows[0]);
  }

  async delete(token: string): Promise<void> {
    await this.pool.query(
      "DELETE FROM pending_requests WHERE token = $1",
      [token]
    );
  }

  async purgeExpired(): Promise<void> {
    await this.pool.query(
      "DELETE FROM pending_requests WHERE expires_at < NOW()"
    );
  }

  private rowToRequest(row: any): PendingRequest {
    return {
      token: row.token,
      slug: row.page_slug,
      requesterName: row.requester_name,
      requesterEmail: row.requester_email,
      reason: row.reason,
      notes: row.notes || undefined,
      startIso: row.start_iso,
      endIso: row.end_iso,
      timezone: row.timezone || undefined,
      createdAt: new Date(row.created_at).getTime(),
    };
  }
}
