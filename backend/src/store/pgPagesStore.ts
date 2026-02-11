import type { Pool } from "pg";
import type { IPagesStore } from "./interfaces";
import type { SchedulingPage } from "./pagesStore";

export class PgPagesStore implements IPagesStore {
  constructor(private pool: Pool) {}

  async create(page: SchedulingPage): Promise<SchedulingPage> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO scheduling_pages
           (slug, owner_name, owner_email, bio,
            default_duration_minutes, buffer_minutes, date_range_days,
            min_notice_hours, include_weekends, is_anonymous,
            created_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE,$10,$11)
         RETURNING id`,
        [
          page.slug,
          page.ownerName,
          page.ownerEmail,
          page.bio || null,
          page.defaultDurationMinutes,
          page.bufferMinutes,
          page.dateRangeDays,
          page.minNoticeHours,
          page.includeWeekends,
          new Date(page.createdAt).toISOString(),
          new Date(page.expiresAt).toISOString(),
        ]
      );

      const pageId = result.rows[0].id;

      for (const url of page.calendarUrls) {
        await client.query(
          "INSERT INTO page_calendars (page_id, raw_calendar_url) VALUES ($1,$2)",
          [pageId, url]
        );
      }

      await client.query("COMMIT");
      return page;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async get(slug: string): Promise<SchedulingPage | undefined> {
    const result = await this.pool.query(
      `SELECT
         sp.slug,
         sp.owner_name,
         sp.owner_email,
         sp.bio,
         sp.default_duration_minutes,
         sp.buffer_minutes,
         sp.date_range_days,
         sp.min_notice_hours,
         sp.include_weekends,
         sp.created_at,
         sp.expires_at,
         COALESCE(
           array_agg(pc.raw_calendar_url)
             FILTER (WHERE pc.raw_calendar_url IS NOT NULL),
           ARRAY[]::text[]
         ) AS calendar_urls
       FROM scheduling_pages sp
       LEFT JOIN page_calendars pc ON pc.page_id = sp.id
       WHERE sp.slug = $1 AND sp.expires_at > NOW()
       GROUP BY sp.id`,
      [slug]
    );

    if (result.rows.length === 0) return undefined;

    const row = result.rows[0];
    return {
      slug: row.slug,
      calendarUrls: row.calendar_urls,
      ownerName: row.owner_name,
      ownerEmail: row.owner_email,
      bio: row.bio || undefined,
      defaultDurationMinutes: row.default_duration_minutes,
      bufferMinutes: row.buffer_minutes,
      dateRangeDays: row.date_range_days,
      minNoticeHours: row.min_notice_hours,
      includeWeekends: row.include_weekends,
      createdAt: new Date(row.created_at).getTime(),
      expiresAt: new Date(row.expires_at).getTime(),
    };
  }

  async getPageId(slug: string): Promise<string | null> {
    const result = await this.pool.query(
      "SELECT id FROM scheduling_pages WHERE slug = $1 AND expires_at > NOW()",
      [slug]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  }

  async purgeExpired(): Promise<void> {
    await this.pool.query(
      "DELETE FROM scheduling_pages WHERE expires_at < NOW()"
    );
  }
}
