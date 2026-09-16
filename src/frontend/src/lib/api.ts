/**
 * Convert a Motoko nanosecond timestamp (bigint) into a JavaScript Date.
 * Returns null when the value cannot be represented as a valid date.
 */
export function timestampToDate(timestamp: bigint): Date | null {
  const date = new Date(Number(timestamp / 1_000_000n));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Format a date as a short human-readable string, with a fallback. */
export function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** A time-of-day greeting used in the app header. */
export function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const CONSENT_KEY = "torque-fit-consent";

export type ConsentChoice = "accepted" | "declined";

/** Read the stored cookie/data consent choice, or null when not yet decided. */
export function getConsentChoice(): ConsentChoice | null {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    return value === "accepted" || value === "declined" ? value : null;
  } catch {
    return null;
  }
}

/** Persist the user's cookie/data consent choice. */
export function setConsentChoice(choice: ConsentChoice): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Storage unavailable — consent simply won't persist this session.
  }
}
