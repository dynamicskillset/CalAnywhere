/** Format a Date as YYYY-MM-DD (local time). */
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable countdown, e.g. "2d 5h" or "1h 23m". */
export function countdownLabel(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const totalHours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalHours >= 24) {
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days}d ${hours}h`;
  }
  return `${totalHours}h ${minutes}m`;
}
