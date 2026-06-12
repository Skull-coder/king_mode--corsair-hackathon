/**
 * Normalizes recipient fields that may arrive as a comma-separated string
 * (from form inputs) into a clean string array.
 */
export function normalizeRecipients(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}
