import "dotenv/config";
import { createCorsair } from "corsair";
import { gmail } from "@corsair-dev/gmail";
import { googlecalendar } from "@corsair-dev/googlecalendar";
import { pool } from "./src/lib/db";
import { emails, threads } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { classifyEmail } from "@/lib/ai/classify";
import { waitUntil } from "@vercel/functions";

export const corsair = createCorsair({
  multiTenancy: true,
  plugins: [
    gmail({
      webhookHooks: {
        messageChanged: {
          after: async (ctx, response) => {
            console.log("-----------------")
            console.log("RESPONSE: ", response)
            console.log("-----------------")
            console.log("CTX:", ctx)
          }
        },
      },
    }),
    googlecalendar({ authType: "oauth_2" }),
  ],
  database: pool,
  kek: process.env.CORSAIR_KEK!,
});