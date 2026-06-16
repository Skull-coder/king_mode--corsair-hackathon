import { corsair } from "@/../corsair";

/**
 * Sends a plain-text email via the Gmail API through Corsair.
 * Builds an RFC822 MIME message, base64url-encodes it, and sends.
 * Gmail automatically fills in the authenticated user's email as the From address.
 */
export async function sendGmailPlainViaCorsair(params: {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { tenantId, to, subject, body } = params;

  try {
    const tenant = corsair.withTenant(tenantId);

    // Build RFC822 MIME message (From is auto-set by Gmail)
    const mime = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=UTF-8",
      "MIME-Version: 1.0",
      "",
      body,
    ].join("\r\n");

    const raw = Buffer.from(mime).toString("base64url");

    const result = await tenant.gmail.api.messages.send({ raw });

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending email",
    };
  }
}
