import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/../corsair";

/**
 * Returns a tenant-scoped Corsair client for the currently authenticated user.
 * Throws 401 if not authenticated.
 */
export async function getCorsairTenant() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return { tenant: corsair.withTenant(userId), userId };
}
