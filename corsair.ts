import "dotenv/config";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "./src/lib/db";

export const corsair = createCorsair({
  multiTenancy: true,
  plugins: [
    gmail({
      // No webhook hooks — we don't sync to our own DB anymore.
      // The webhook is purely a "something changed" signal that
      // triggers an SSE → TanStack Query invalidation on the frontend.
    }),
    googlecalendar({ authType: "oauth_2" }),
  ],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
});
