/**
 * Returns the user's locale settings.
 *
 * Accepts an optional `timezone` override — populated from the browser's
 * `Intl.DateTimeFormat().resolvedOptions().timeZone` sent as `x-timezone`
 * request header. Falls back to Asia/Kolkata / IN if missing or unrecognized.
 */

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Asia/Kolkata":        "IN",
  "Asia/Colombo":        "LK",
  "Asia/Dhaka":          "BD",
  "Asia/Karachi":        "PK",
  "Asia/Dubai":          "AE",
  "Asia/Singapore":      "SG",
  "Asia/Tokyo":          "JP",
  "Asia/Shanghai":       "CN",
  "Asia/Seoul":          "KR",
  "Asia/Jakarta":        "ID",
  "America/New_York":    "US",
  "America/Chicago":     "US",
  "America/Denver":      "US",
  "America/Los_Angeles": "US",
  "America/Toronto":     "CA",
  "America/Vancouver":   "CA",
  "America/Sao_Paulo":   "BR",
  "Europe/London":       "GB",
  "Europe/Paris":        "FR",
  "Europe/Berlin":       "DE",
  "Europe/Madrid":       "ES",
  "Europe/Rome":         "IT",
  "Europe/Amsterdam":    "NL",
  "Australia/Sydney":    "AU",
  "Australia/Melbourne": "AU",
  "Pacific/Auckland":    "NZ",
};

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const DEFAULT_COUNTRY  = "IN";

export async function getUserLocale(
  _userId: string,
  timezoneOverride?: string,
): Promise<{ timezone: string; country: string }> {
  try {
    const timezone = timezoneOverride?.trim() || DEFAULT_TIMEZONE;
    // Validate it's a real IANA timezone by attempting to use it
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    const country = TIMEZONE_TO_COUNTRY[timezone] ?? DEFAULT_COUNTRY;
    return { timezone, country };
  } catch {
    // Invalid timezone string — fall back to defaults
    return { timezone: DEFAULT_TIMEZONE, country: DEFAULT_COUNTRY };
  }
}