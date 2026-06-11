import { corsair } from "@/../corsair";
import { db } from "@/lib/db";
import { emails, threads, emailRecipients } from "@/lib/db/schema";
import { eq, and, inArray, ne, desc } from "drizzle-orm";

export async function deleteThread(tenantId: string, threadId: string){
    const tenant = corsair.withTenant(tenantId)

    await tenant.gmail.api.threads.delete({
        id: threadId
    }) // return void

    await db.transaction(async (tx) => {
        // 1. Find all email IDs in this thread (scoped to tenant)
        const emailsInThread = await tx
            .select({ id: emails.id })
            .from(emails)
            .where(and(eq(emails.threadId, threadId), eq(emails.userId, tenantId)));

        const emailIds = emailsInThread.map((e) => e.id);

        // 2. Delete recipients for all emails in this thread
        if (emailIds.length > 0) {
            await tx
                .delete(emailRecipients)
                .where(inArray(emailRecipients.emailId, emailIds));
        }

        // 3. Delete all emails in this thread
        await tx
            .delete(emails)
            .where(and(eq(emails.threadId, threadId), eq(emails.userId, tenantId)));

        // 4. Delete the thread itself
        await tx
            .delete(threads)
            .where(and(eq(threads.id, threadId), eq(threads.userId, tenantId)));
    });

}

export async function getThread(tenantId: string, threadId: string){
    const thread = await db.query.threads.findFirst({
        where: and(eq(threads.id, threadId), eq(threads.userId, tenantId)),
    });

    if (!thread) {
        throw new Error(`Thread ${threadId} not found for tenant ${tenantId}`);
    }

    const threadEmails = await db.query.emails.findMany({
        where: and(
            eq(emails.threadId, threadId),
            eq(emails.userId, tenantId),
            ne(emails.status, "DRAFT"),
        ),
        orderBy: desc(emails.receivedAt),
    });

    return { ...thread, emails: threadEmails };
}

export async function listThread(tenantId: string, threadId: string){
    const threadEmails = await db.query.emails.findMany({
        where: and(
            eq(emails.threadId, threadId),
            eq(emails.userId, tenantId),
            ne(emails.status, "DRAFT"),
        ),
        orderBy: desc(emails.receivedAt),
    });

    return threadEmails;
}

export async function trashThread(tenantId: string, threadId: string){
    const tenant = corsair.withTenant(tenantId)

    await tenant.gmail.api.threads.trash({
        id: threadId
    })

    await db.transaction(async (tx) => {
        // 1. Mark all emails in this thread as trashed
        await tx
            .update(emails)
            .set({ isTrashed: true, trashedAt: new Date() })
            .where(and(eq(emails.threadId, threadId), eq(emails.userId, tenantId)));

        // 2. Mark the thread itself as trashed
        await tx
            .update(threads)
            .set({ isTrashed: true, trashedAt: new Date() })
            .where(and(eq(threads.id, threadId), eq(threads.userId, tenantId)));
    });

}

export async function untrashThread(tenantId: string, threadId: string){
    const tenant = corsair.withTenant(tenantId)

    await tenant.gmail.api.threads.untrash({
        id: threadId
    })

    await db.transaction(async (tx) => {
        // 1. Mark all emails in this thread as untrashed
        await tx
            .update(emails)
            .set({ isTrashed: false, trashedAt: null })
            .where(and(eq(emails.threadId, threadId), eq(emails.userId, tenantId)));

        // 2. Mark the thread itself as untrashed
        await tx
            .update(threads)
            .set({ isTrashed: false, trashedAt: null })
            .where(and(eq(threads.id, threadId), eq(threads.userId, tenantId)));
    });

}