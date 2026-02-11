import type { Pool } from "pg";
import type { IBookingsStore, Booking } from "./interfaces";

export class PgBookingsStore implements IBookingsStore {
  constructor(private pool: Pool) {}

  async create(data: Omit<Booking, "id" | "createdAt">): Promise<Booking> {
    const result = await this.pool.query(
      `INSERT INTO bookings
         (page_id, requester_name, requester_email,
          reason, notes, start_time, end_time, timezone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, created_at`,
      [
        data.pageId,
        data.requesterName,
        data.requesterEmail,
        data.reason,
        data.notes || null,
        data.startTime,
        data.endTime,
        data.timezone || null,
      ]
    );

    const row = result.rows[0];
    return {
      ...data,
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
}
