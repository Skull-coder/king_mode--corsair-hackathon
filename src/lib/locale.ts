/**
 * Returns the user's locale settings.
 * Currently defaults to India. Wire up to Clerk user metadata
 * or a DB lookup when ready.
 */
export async function getUserLocale(_userId: string): Promise<{
  timezone: string;
  country: string;
}> {
  return {
    timezone: "Asia/Kolkata",
    country: "IN",
  };
}