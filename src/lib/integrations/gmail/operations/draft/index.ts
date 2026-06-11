import * as draftSchema from "./model";
import { db } from "@/lib/db";
import { emails, threads, emailRecipients } from "@/lib/db/schema";
import { corsair } from "@/../corsair";
import { classifyEmail } from "@/lib/ai/classify";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { and, eq } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/*                              CREATE DRAFT                                  */
/* -------------------------------------------------------------------------- */

export async function createDraft(
  tenantId: string,
  payload: draftSchema.CreateDraftInput,
) {
  try {
    // ── 0. Validate input payload ────────────────────────────────────────────
    const { to, cc, bcc, subject, body } =
      await draftSchema.createDraftSchema.parseAsync(payload);

    const tenant = corsair.withTenant(tenantId);

    // ── 1. Build raw MIME message and push to Gmail ──────────────────────────
    const mimeMessage = [
      `To: ${to.join(", ")}`,
      `Cc: ${cc.join(", ")}`,
      `Bcc: ${bcc.join(", ")}`,
      `Subject: ${subject}`,
      "",
      body,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    const result = await tenant.gmail.api.drafts.create({
      draft: { message: { raw } },
    });

    const draftId: string | undefined = result.id;
    const message: { id?: string } | undefined = result.message;

    if (!draftId || !message?.id) {
      throw new Error("Gmail API did not return a valid draft response");
    }

    // ── 2. Fetch enriched draft record from Corsair's synced DB ──────────────
    async function waitForMessage(
      messageId: string,
      retries = 50,
      delayMs = 500,
    ) {
      for (let i = 0; i < retries; i++) {
        const results = await tenant.gmail.db.messages.findByEntityId(messageId);
        if (results) return results;
        await new Promise((res) => setTimeout(res, delayMs));
      }
      return null;
    }

    const createdDraft = await waitForMessage(message.id);

    console.log("createdDraft:", createdDraft);

    const draftData = createdDraft?.data as
      | {
          id: string;
          threadId: string;
          subject?: string | null;
          body?: string | null;
          from?: string | null;
          snippet?: string | null;
          createdAt?: string | number | Date | null;
        }
      | undefined;

    if (!draftData) {
      throw new Error(
        `Draft message ${message.id} not found in Corsair DB after creation`,
      );
    }

    // ── 3. Upsert thread (draft may be reply in existing thread or new one) ──
    await db
      .insert(threads)
      .values({
        id: draftData.threadId,
        userId: tenantId,
        subject: draftData.subject,
        lastMessageAt: draftData.createdAt
          ? new Date(draftData.createdAt)
          : new Date(),
        isRead: true, // you authored it
        isArchived: false,
        isStarred: false,
        labels: ["DRAFT"],
      })
      .onConflictDoUpdate({
        target: threads.id,
        set: {
          lastMessageAt: draftData.createdAt
            ? new Date(draftData.createdAt)
            : new Date(),
          labels: ["DRAFT"],
          updatedAt: new Date(),
        },
      });

    // ── 4. Insert email record ───────────────────────────────────────────────
    await db.insert(emails).values({
      id: draftData.id,
      draftId,
      threadId: draftData.threadId,
      userId: tenantId,
      direction: "OUTGOING",
      status: "DRAFT",
      sender: draftData.from ?? null,
      senderEmail: draftData.from ?? null,
      subject: draftData.subject ?? null,
      bodySnippet: (draftData.snippet ?? "").slice(0, 500),
      rawBody: raw,
      htmlBody: draftData.body ?? null,
      isRead: true, // you authored it
      isStarred: false,
      receivedAt: draftData.createdAt
        ? new Date(draftData.createdAt)
        : new Date(),
    });

    // ── 5. Insert recipients (to / cc / bcc) ─────────────────────────────────
    const recipientRows: {
      emailId: string;
      userId: string;
      email: string;
      type: "to" | "cc" | "bcc";
    }[] = [
      ...to.map((email) => ({
        emailId: draftData.id,
        userId: tenantId,
        email,
        type: "to" as const,
      })),
      ...cc.map((email) => ({
        emailId: draftData.id,
        userId: tenantId,
        email,
        type: "cc" as const,
      })),
      ...bcc.map((email) => ({
        emailId: draftData.id,
        userId: tenantId,
        email,
        type: "bcc" as const,
      })),
    ];

    if (recipientRows.length > 0) {
      await db.insert(emailRecipients).values(recipientRows);
    }

    // ── 6. Return draft summary ──────────────────────────────────────────────
    return {
      draftId,
      message,
    };
  } catch (error) {
    console.error("Error in createDraft:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                              DELETE DRAFT                                  */
/* -------------------------------------------------------------------------- */

export async function deleteDraft(tenantId: string, draftId: string) {
  try {
    const tenant = corsair.withTenant(tenantId);

    // ── 1. Delete from Gmail and Corsair synced DB ───────────────────────────
    await tenant.gmail.api.drafts.delete({ id: draftId });
    await tenant.gmail.db.messages.deleteById(draftId);

    // ── 2. Remove local DB records (cascade handles recipients) ──────────────
    await db.transaction(async (tx) => {
      const [email] = await tx
        .select({ id: emails.id, status: emails.status })
        .from(emails)
        .where(and(eq(emails.draftId, draftId), eq(emails.userId, tenantId)));

      if (!email) return; // nothing to clean up locally

      if(email.status !== "DRAFT"){
        throw new Error("This draft is already sent, its not a draft anymore")
      }

      await tx
        .delete(emailRecipients)
        .where(eq(emailRecipients.emailId, email.id));

      await tx.delete(emails).where(eq(emails.id, email.id));
    });
  } catch (error) {
    console.error("Error in deleteDraft:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                               GET DRAFT                                    */
/* -------------------------------------------------------------------------- */

export async function getDraft(draftId: string, tenantId: string) {
  try {
    const email = await db
      .select()
      .from(emails)
      .where(and(eq(emails.draftId, draftId), eq(emails.userId, tenantId), eq(emails.status, "DRAFT")));
    return email;
  } catch (error) {
    console.error("Error in getDraft:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                              LIST DRAFTS                                   */
/* -------------------------------------------------------------------------- */

export async function listDrafts(tenantId: string) {
  try {
    const email = await db
      .select()
      .from(emails)
      .where(and(eq(emails.userId, tenantId), eq(emails.status, "DRAFT")));

    return email;
  } catch (error) {
    console.error("Error in listDrafts:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                              SEND DRAFT                                    */
/* -------------------------------------------------------------------------- */

export async function sendDraft(tenantId: string, draftId: string) {
  try {
    const tenant = corsair.withTenant(tenantId);

    // ── 1. Fetch complete draft data & current recipients before mutation ──
    const [oldEmail] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.draftId, draftId), eq(emails.userId, tenantId)))
      .limit(1);

    if (!oldEmail) {
      throw new Error(`No email found for draftId: ${draftId}`);
    }

    const oldRecipients = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.emailId, oldEmail.id));

    // ── 2. Send the draft via Gmail API ────────────────────────────────────
    const sent = await tenant.gmail.api.drafts.send({ id: draftId });

    // Gmail generates a brand-new message ID for sent items
    const newSentMessageId = sent.id ?? oldEmail.id;
    const now = new Date();

    // ── 3. Run AI tasks on final contents right before DB writes ───────────
    const textForAI = `Subject: ${oldEmail.subject}\n\n${oldEmail.rawBody}`;

    const [priority, embedding] = await Promise.all([
      classifyEmail(textForAI),
      generateEmbedding(textForAI),
    ]);

    // ── 4. Execute atomic DB updates inside a transaction ──────────────────
    await db.transaction(async (tx) => {
      // Step A: Insert the sent email as a brand-new row
      await tx.insert(emails).values({
        id: newSentMessageId,
        draftId,
        threadId: oldEmail.threadId,
        userId: tenantId,
        direction: "OUTGOING",
        status: "SENT",
        sender: oldEmail.sender,
        senderEmail: oldEmail.senderEmail,
        subject: oldEmail.subject,
        bodySnippet: oldEmail.bodySnippet,
        rawBody: oldEmail.rawBody,
        htmlBody: oldEmail.htmlBody,
        isRead: true,
        isStarred: oldEmail.isStarred,
        priority,
        embedding,
        receivedAt: oldEmail.receivedAt,
        updatedAt: now,
      });

      // Step B: Re-map and insert recipients for the new sent message row
      if (oldRecipients.length > 0) {
        const newRecipientRows = oldRecipients.map((recipient) => ({
          emailId: newSentMessageId,
          userId: tenantId,
          name: recipient.name,
          email: recipient.email,
          type: recipient.type,
        }));
        await tx.insert(emailRecipients).values(newRecipientRows);
      }

      // Step C: Wipe out the old draft row
      // (onDelete: "cascade" cleans up old recipients in Postgres)
      await tx.delete(emails).where(eq(emails.id, oldEmail.id));

      // Step D: Update parent thread timestamps
      await tx
        .update(threads)
        .set({
          lastMessageAt: now,
          updatedAt: now,
          labels: ["SENT"], // clear the DRAFT label
        })
        .where(eq(threads.id, oldEmail.threadId));
    });
  } catch (error) {
    console.error("Error in sendDraft:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE DRAFT                                  */
/* -------------------------------------------------------------------------- */

export async function updateDraft(
  tenantId: string,
  draftId: string,
  payload: draftSchema.UpdateDraftInput,
) {
  try {
    // ── 0. Validate input payload (partial fields are allowed) ─────────────
    const { to, cc, bcc, subject, body } =
      await draftSchema.updateDraftSchema.parseAsync(payload);

    const tenant = corsair.withTenant(tenantId);

    // ── 1. Fetch the full existing draft row ──────────────────────────────
    const [existing] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.draftId, draftId), eq(emails.status, "DRAFT")))
      .limit(1);

    if (!existing) {
      throw new Error(`No draft found for draftId: ${draftId}`);
    }

    // ── 2. Fetch existing recipients (needed to merge partial updates) ────
    const existingRecipients = await db
      .select()
      .from(emailRecipients)
      .where(eq(emailRecipients.emailId, existing.id));

    // ── 3. Merge provided fields with existing data (for the MIME push) ──
    const mergedTo = to ?? existingRecipients
      .filter((r) => r.type === "to")
      .map((r) => r.email);
    const mergedCc = cc ?? existingRecipients
      .filter((r) => r.type === "cc")
      .map((r) => r.email);
    const mergedBcc = bcc ?? existingRecipients
      .filter((r) => r.type === "bcc")
      .map((r) => r.email);
    const mergedSubject = subject ?? existing.subject ?? "";
    const mergedBody = body ?? existing.rawBody ?? "";

    // ── 4. Rebuild MIME and push to Gmail ─────────────────────────────────
    const mimeMessage = [
      `To: ${mergedTo.join(", ")}`,
      `Cc: ${mergedCc.join(", ")}`,
      `Bcc: ${mergedBcc.join(", ")}`,
      `Subject: ${mergedSubject}`,
      "",
      mergedBody,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    await tenant.gmail.api.drafts.update({
      id: draftId,
      draft: { message: { raw } },
    });

    const now = new Date();

    // ── 5. Update DB — ONLY columns whose values were actually provided ───
    const dbSetData: Record<string, unknown> = { updatedAt: now };
    if (body !== undefined) {
      dbSetData.rawBody = body;
      dbSetData.bodySnippet = body.slice(0, 500);
    }
    if (subject !== undefined) {
      dbSetData.subject = subject;
    }

    await db
      .update(emails)
      .set(dbSetData)
      .where(eq(emails.id, existing.id));

    // ── 6. Replace recipients only if any address field was provided ──────
    const recipientsChanged =
      to !== undefined || cc !== undefined || bcc !== undefined;

    if (recipientsChanged) {
      await db
        .delete(emailRecipients)
        .where(eq(emailRecipients.emailId, existing.id));

      const recipientRows = [
        ...mergedTo.map((addr) => ({ type: "to" as const, email: addr })),
        ...mergedCc.map((addr) => ({ type: "cc" as const, email: addr })),
        ...mergedBcc.map((addr) => ({ type: "bcc" as const, email: addr })),
      ].map(({ type, email: addr }) => ({
        emailId: existing.id,
        userId: existing.userId,
        type,
        email: addr,
      }));

      if (recipientRows.length > 0) {
        await db.insert(emailRecipients).values(recipientRows);
      }
    }
  } catch (error) {
    console.error("Error in updateDraft:", error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                              REPLY DRAFT                                  */
/* -------------------------------------------------------------------------- */

export async function createReplyDraft(
  tenantId: string,
  payload: draftSchema.CreateReplyDraftInput,
) {
  try {
    // 0) Validate input
    const { messageId, body } =
      await draftSchema.createReplyDraftSchema.parseAsync(payload);

    const tenant = corsair.withTenant(tenantId);

    // 1) Fetch the original email we are replying to
    const [parentEmail] = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, messageId), eq(emails.userId, tenantId)))
      .limit(1);

    if (!parentEmail) {
      throw new Error(`No email found for messageId: ${messageId}`);
    }

    if (!parentEmail.threadId) {
      throw new Error(`Parent email ${messageId} has no threadId`);
    }

    const replyTo = parentEmail.senderEmail;
    if (!replyTo) {
      throw new Error(
        `Parent email ${messageId} does not have senderEmail to reply to`,
      );
    }

    // 2) Build reply MIME
    const replySubject = parentEmail.subject
      ? parentEmail.subject.toLowerCase().startsWith("re:")
        ? parentEmail.subject
        : `Re: ${parentEmail.subject}`
      : "Re:";

    const mimeMessage = [
      `To: ${replyTo}`,
      `Subject: ${replySubject}`,
      "",
      body,
    ].join("\n");

    const raw = Buffer.from(mimeMessage).toString("base64url");

    // 3) Create reply draft in Gmail/Corsair under same thread
    const result = await tenant.gmail.api.drafts.create({
      draft: {
        message: {
          raw,
          threadId: parentEmail.threadId,
        },
      },
    });

    const draftId: string | undefined = result.id;
    const message: { id?: string } | undefined = result.message;

    if (!draftId || !message?.id) {
      throw new Error("Gmail API did not return a valid reply draft response");
    }

    // 4) Fetch enriched draft record from Corsair synced DB
    const [createdDraft] = await tenant.gmail.db.messages.search({
      data: { id: { equals: message.id } },
    });

    const draftData = createdDraft?.data as
      | {
          id: string;
          threadId?: string;
          subject?: string | null;
          body?: string | null;
          from?: string | null;
          snippet?: string | null;
          createdAt?: string | number | Date | null;
        }
      | undefined;

    if (!draftData || !draftData.threadId) {
      throw new Error(
        `Reply draft message ${message.id} not found in Corsair DB after creation`,
      );
    }

    // 5) Upsert thread
    await db
      .insert(threads)
      .values({
        id: draftData.threadId,
        userId: tenantId,
        subject: draftData.subject ?? parentEmail.subject ?? null,
        lastMessageAt: draftData.createdAt
          ? new Date(draftData.createdAt)
          : new Date(),
        isRead: true,
        isArchived: false,
        isStarred: false,
        labels: ["DRAFT"],
      })
      .onConflictDoUpdate({
        target: threads.id,
        set: {
          lastMessageAt: draftData.createdAt
            ? new Date(draftData.createdAt)
            : new Date(),
          labels: ["DRAFT"],
          updatedAt: new Date(),
        },
      });

    // 6) Insert email row
    await db.insert(emails).values({
      id: draftData.id,
      draftId,
      threadId: draftData.threadId,
      userId: tenantId,
      direction: "OUTGOING",
      status: "DRAFT",
      sender: draftData.from ?? null,
      senderEmail: draftData.from ?? null,
      subject: draftData.subject ?? replySubject,
      bodySnippet: (draftData.snippet ?? body).slice(0, 500),
      rawBody: raw,
      htmlBody: draftData.body ?? body,
      isRead: true,
      isStarred: false,
      receivedAt: draftData.createdAt
        ? new Date(draftData.createdAt)
        : new Date(),
    });

    // 7) Insert reply recipient
    await db.insert(emailRecipients).values({
      emailId: draftData.id,
      userId: tenantId,
      email: replyTo,
      type: "to",
    });

    // 8) Return
    return {
      draftId,
      message,
      threadId: draftData.threadId,
    };
  } catch (error) {
    console.error("Error in createReplyDraft:", error);
    throw error;
  }
}
