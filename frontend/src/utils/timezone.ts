/**
 * Convert a wall-clock time in an IANA timezone to a UTC Date.
 *
 * Handles DST correctly: for each specific calendar date, the actual UTC offset
 * for that timezone is computed using Intl, so "09:00 Europe/London" returns
 * 09:00 UTC in winter (GMT) and 08:00 UTC in summer (BST).
 *
 * @param dateStr  - Calendar date as "YYYY-MM-DD"
 * @param timeStr  - Wall-clock time as "HH:MM"
 * @param timezone - IANA timezone name (e.g. "Europe/London")
 */
export function wallClockToUtc(dateStr: string, timeStr: string, timezone: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  // Step 1: create a Date treating the wall-clock time as UTC (naive — not yet correct)
  const naiveUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Step 2: find what local time this UTC instant represents in the target timezone
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts = fmt.formatToParts(naiveUtc);
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  let localHour = get("hour");
  if (localHour === 24) localHour = 0; // midnight edge case from some Intl implementations

  // What the target timezone shows for our naive UTC time, expressed as UTC ms
  const localAsUtcMs = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    localHour,
    get("minute"),
    get("second")
  );

  // Step 3: the offset between what we want (wall clock) and what the TZ shows
  const offsetMs = naiveUtc.getTime() - localAsUtcMs;

  // Step 4: shift naive UTC by the offset → correct UTC time
  return new Date(naiveUtc.getTime() + offsetMs);
}

/**
 * Return all IANA timezone names grouped by region prefix (e.g. "Europe", "America"),
 * sorted by current UTC offset then alphabetically within each group.
 * Each entry includes the IANA name and a formatted offset label like "UTC+1".
 */
export interface TimezoneEntry {
  iana: string;
  label: string;     // "Europe/London (UTC+0)"
  offsetMin: number; // numeric offset in minutes, for sorting
}

export function getGroupedTimezones(): Map<string, TimezoneEntry[]> {
  const allTzs = (Intl as any).supportedValuesOf("timeZone") as string[];
  const now = new Date();

  const entries: TimezoneEntry[] = allTzs.map((tz) => {
    let offsetStr = "UTC";
    let offsetMin = 0;
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      }).formatToParts(now);
      const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
      offsetStr = raw.replace("GMT", "UTC");
      const m = offsetStr.match(/UTC([+-])(\d+)(?::(\d+))?/);
      if (m) {
        const sign = m[1] === "+" ? 1 : -1;
        offsetMin = sign * (parseInt(m[2]) * 60 + parseInt(m[3] ?? "0"));
      }
    } catch {
      // leave defaults
    }
    return {
      iana: tz,
      label: `${tz.replace(/_/g, " ")} (${offsetStr})`,
      offsetMin,
    };
  });

  // Sort by offset, then name
  entries.sort((a, b) => a.offsetMin - b.offsetMin || a.iana.localeCompare(b.iana));

  const groups = new Map<string, TimezoneEntry[]>();
  for (const entry of entries) {
    const region = entry.iana.includes("/") ? entry.iana.split("/")[0] : "Other";
    if (!groups.has(region)) groups.set(region, []);
    groups.get(region)!.push(entry);
  }

  return groups;
}

/** Detect the user's IANA timezone from the browser. */
export function detectTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
