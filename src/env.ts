import { z } from "zod";

// ---------------------------------------------------------------------------
// Server-side env vars — only available in Node (API routes, RSC, etc.)
// ---------------------------------------------------------------------------
const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
      "DATABASE_URL must start with postgresql:// or postgres://",
    ),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CORSAIR_API_KEY: z.string().min(1, "CORSAIR_API_KEY is required"),
  CORSAIR_KEK: z.string().min(1, "CORSAIR_KEK is required"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  OPENROUTER_API_KEY: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// ---------------------------------------------------------------------------
// Client-side env vars — exposed to the browser via NEXT_PUBLIC_ prefix
// ---------------------------------------------------------------------------
const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
});

// ---------------------------------------------------------------------------
// Combined schema
// ---------------------------------------------------------------------------
const envSchema = serverSchema.merge(clientSchema);

// ---------------------------------------------------------------------------
// Parse & export
//
// On the server we validate everything.
// On the client only NEXT_PUBLIC_* vars are available, so we validate just
// clientSchema to avoid false negatives.
// ---------------------------------------------------------------------------
function parseEnv() {
  const isServer = typeof window === "undefined";

  if (isServer) {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:\n",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables — check server logs.");
    }

    return parsed.data;
  }

  // Client-side: only NEXT_PUBLIC_ vars are available
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    console.error(
      "❌ Invalid client environment variables:\n",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid client environment variables.");
  }

  // Return a type-compatible object by spreading server defaults.
  // Server-only values will never be read on the client.
  return parsed.data as z.infer<typeof envSchema>;
}

export const env = parseEnv();

// Re-export types for external use
export type Env = z.infer<typeof envSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
