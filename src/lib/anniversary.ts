// Central place to configure the couple's anniversary anchor.
// Adjust START_DATE to the real "day one".
export const START_DATE = new Date("2025-07-09T00:00:00");

export function daysTogether(now: Date = new Date()): number {
  const ms = now.getTime() - START_DATE.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}
