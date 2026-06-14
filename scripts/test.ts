
import { parseEmail } from "@/lib/email-parser";
import { corsair } from "../corsair";

const tenant = corsair.withTenant("user_3F5jXGXaa2BdYfaTey4Ltnlu8zE")

const listResponse = await tenant.gmail.api.messages.list({
  labelIds: ["INBOX"],
  maxResults: 15,
});

const rawMessages = listResponse.messages || [];

const enriched = await Promise.all(
  rawMessages.map(async (msg) => {
    if (!msg.id) return null;
    try {
      const full = await tenant.gmail.db.messages.findById(msg.id);

      return parseEmail(full);
    } catch {
      // Fallback to whatever the list gave us
      return parseEmail(msg);
    }
  }),
);

console.log("TESTING:", JSON.stringify(enriched))
