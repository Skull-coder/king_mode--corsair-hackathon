import { corsair } from "@/../corsair"
import { gmailRawGetProfile } from "./gmail-raw"

export type GmailSendPlainInput = {
  to: string
  subject: string
  body: string
  from?: string
}

export type GmailSendPlainResult = {
  success: true
  to: string
  subject: string
  messageId: string | null
}

function encodeGmailRawMessage(message: string) {
  return Buffer.from(message, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

function buildPlainTextMime(input: {
  from: string
  to: string
  subject: string
  body: string
}) {
  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    input.body,
  ].join("\r\n")
}

async function resolveSenderEmail(tenantId: string, fallback?: string) {
  const trimmed = fallback?.trim()
  if (trimmed) return trimmed

  const profile = await gmailRawGetProfile(tenantId)
  return profile.emailAddress?.trim() ?? ""
}

export async function sendGmailPlainViaCorsair(
  tenantId: string,
  input: GmailSendPlainInput,
): Promise<GmailSendPlainResult> {
  const to = input.to.trim()
  const subject = input.subject.trim()

  if (!to || !subject) {
    throw new Error("To and subject are required to send email")
  }

  const from = await resolveSenderEmail(tenantId, input.from)
  if (!from) {
    throw new Error("Could not resolve sender email from Gmail profile")
  }

  const raw = encodeGmailRawMessage(
    buildPlainTextMime({ from, to, subject, body: input.body }),
  )

  const result = await corsair
    .withTenant(tenantId)
    .gmail.api.messages.send({ raw })

  return {
    success: true,
    to,
    subject,
    messageId: result.id ?? null,
  }
}