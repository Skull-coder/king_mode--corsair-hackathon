import { corsair } from "@/../corsair";
import { db } from "@/lib/db";
import { emails, threads, emailRecipients } from "@/lib/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import * as messageSchema from "./model";

export async function deleteMessage(tenantId: string, messageId: string) {
  const tenant = corsair.withTenant(tenantId);

  await tenant.gmail.api.messages.delete({
    id: messageId,
  }); // returns void

  // Delete from our database — look up the threadId before removing the email
  const email = await db.query.emails.findFirst({
    where: and(eq(emails.id, messageId), eq(emails.userId, tenantId)),
    columns: { threadId: true },
  });

  if (!email) {
    // Already gone from our DB — nothing to clean up
    return;
  }

  const threadId = email.threadId;

  await db.transaction(async (tx) => {
    // 1. Remove all recipients for this email
    await tx
      .delete(emailRecipients)
      .where(eq(emailRecipients.emailId, messageId));

    // 2. Remove the email itself
    await tx.delete(emails).where(eq(emails.id, messageId));

    // 3. If this was the last email in the thread, remove the thread too
    const remaining = await tx
      .select({ id: emails.id })
      .from(emails)
      .where(eq(emails.threadId, threadId))
      .limit(1);

    if (remaining.length === 0) {
      await tx.delete(threads).where(eq(threads.id, threadId));
    }
  });
}

export async function getMessage(tenantId: string, messageId: string) {
  const email = await db.query.emails.findFirst({
    where: and(
      eq(emails.id, messageId),
      eq(emails.userId, tenantId),
      ne(emails.status, "DRAFT"),
    ),
  });

  if (!email) {
    throw new Error(`Message ${messageId} not found for tenant ${tenantId}`);
  }

  const recipients = await db.query.emailRecipients.findMany({
    where: eq(emailRecipients.emailId, messageId),
  });

  return { ...email, recipients };
}

export async function listMessages(tenantId: string) {
  const messages = await db.query.emails.findMany({
    where: and(eq(emails.userId, tenantId), ne(emails.status, "DRAFT")),
    orderBy: desc(emails.receivedAt),
  });

  return messages;
}

export async function sendMessage(
  tenantId: string,
  payload: messageSchema.SendMessageInput,
) {
  const tenant = corsair.withTenant(tenantId);

  const { to, cc, bcc, subject, body } =
    await messageSchema.sendMessageInputModel.parseAsync(payload);

  const mimeMessage = [
    `To: ${to.join(", ")}`,
    `Cc: ${cc.join(", ")}`,
    `Bcc: ${bcc.join(", ")}`,
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  const raw = Buffer.from(mimeMessage).toString("base64url");

  const message = await tenant.gmail.api.messages.send({
    raw,
  });

  const messageId = message.id;
  const threadId = message.threadId;

  if (!messageId || !threadId) {
    throw new Error("cant get messageId and threadId from sendMessage");
  }

  await db.transaction(async (tx) => {
    // 1. Insert the sent email
    await tx.insert(emails).values({
      id: messageId,
      threadId: threadId,
      userId: tenantId,
      direction: "OUTGOING",
      status: "SENT",
      subject,
      rawBody: body,
      bodySnippet: body.substring(0, 500),
      receivedAt: new Date(),
      isRead: true,
    });

    // 2. Insert recipients (to, cc, bcc)
    const recipientRows: Array<{
      emailId: string;
      userId: string;
      email: string;
      type: "to" | "cc" | "bcc";
    }> = [
      ...to.map((addr) => ({
        emailId: messageId,
        userId: tenantId,
        email: addr,
        type: "to" as const,
      })),
      ...cc.map((addr) => ({
        emailId: messageId,
        userId: tenantId,
        email: addr,
        type: "cc" as const,
      })),
      ...bcc.map((addr) => ({
        emailId: messageId,
        userId: tenantId,
        email: addr,
        type: "bcc" as const,
      })),
    ];

    if (recipientRows.length > 0) {
      await tx.insert(emailRecipients).values(recipientRows);
    }

    // 3. Upsert the thread — create if new, otherwise bump lastMessageAt
    await tx
      .insert(threads)
      .values({
        id: threadId,
        userId: tenantId,
        subject,
        lastMessageAt: new Date(),
      })
      .onConflictDoUpdate({
        target: threads.id,
        set: {
          lastMessageAt: new Date(),
          subject,
          updatedAt: new Date(),
        },
      });
  });
}

export async function trashMessage(tenantId: string, messageId: string) {
  const tenant = corsair.withTenant(tenantId);
  const email = await tenant.gmail.api.messages.trash({ id: messageId });

  await db.transaction(async (tx) => {
    await tx
      .update(emails)
      .set({ isTrashed: true, trashedAt: new Date() })
      .where(eq(emails.id, messageId));

    const untrashedInThread = await tx
      .select({ id: emails.id })
      .from(emails)
      .where(
        and(eq(emails.threadId, email.threadId!), eq(emails.isTrashed, false)),
      )
      .limit(1); // limit(1) is enough — you only care if ANY exist

    if (untrashedInThread.length === 0) {
      await tx
        .update(threads)
        .set({ isTrashed: true, trashedAt: new Date() })
        .where(eq(threads.id, email.threadId!));
    }
  });
}

export async function untrashMessage(tenantId: string, messageId: string) {
  const tenant = corsair.withTenant(tenantId);
  const email = await tenant.gmail.api.messages.untrash({ id: messageId });

  await db.transaction(async (tx) => {
    await tx
      .update(emails)
      .set({ isTrashed: false, trashedAt: null })
      .where(eq(emails.id, messageId));

    await tx
      .update(threads)
      .set({ isTrashed: false, trashedAt: null })
      .where(eq(threads.id, email.threadId!));
  });
}
