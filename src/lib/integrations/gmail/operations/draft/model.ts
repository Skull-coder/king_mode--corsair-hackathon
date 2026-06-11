import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                                  SHARED                                    */
/* -------------------------------------------------------------------------- */

const emailSchema = z.email();

/* -------------------------------------------------------------------------- */
/*                               CREATE DRAFT                                 */
/* -------------------------------------------------------------------------- */

export const createDraftSchema = z.object({
  to: z.array(emailSchema).min(1, "At least one recipient is required"),
  cc: z.array(emailSchema).default([]),
  bcc: z.array(emailSchema).default([]),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type CreateDraftInput = z.infer<typeof createDraftSchema>;

/* -------------------------------------------------------------------------- */
/*                            CREATE REPLY DRAFT                              */
/* -------------------------------------------------------------------------- */

export const createReplyDraftSchema = z.object({
  messageId: z.string().min(1),
  body: z.string().min(1),
});

export type CreateReplyDraftInput = z.infer<typeof createReplyDraftSchema>;

/* -------------------------------------------------------------------------- */
/*                           CREATE FORWARD DRAFT                             */
/* -------------------------------------------------------------------------- */

export const createForwardDraftSchema = z.object({
  sourceMessageId: z.string().min(1, "Source message ID is required"),
  to: z.array(emailSchema).min(1, "At least one recipient is required"),
  cc: z.array(emailSchema).default([]),
  bcc: z.array(emailSchema).default([]),
  additionalMessage: z.string().default(""),
});

export type CreateForwardDraftInput = z.infer<typeof createForwardDraftSchema>;

/* -------------------------------------------------------------------------- */
/*                                UPDATE DRAFT                                */
/* -------------------------------------------------------------------------- */

export const updateDraftSchema = z
  .object({
    to: z.array(emailSchema).optional(),
    cc: z.array(emailSchema).optional(),
    bcc: z.array(emailSchema).optional(),
    subject: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      data.to !== undefined ||
      data.cc !== undefined ||
      data.bcc !== undefined ||
      data.subject !== undefined ||
      data.body !== undefined,
    { message: "At least one field must be provided to update the draft" },
  );

export type UpdateDraftInput = z.infer<typeof updateDraftSchema>;

/* -------------------------------------------------------------------------- */
/*                                DELETE DRAFT                                */
/* -------------------------------------------------------------------------- */

export const deleteDraftSchema = z.object({
  id: z.string().min(1, "Draft ID is required"),
});

export type DeleteDraftInput = z.infer<typeof deleteDraftSchema>;

/* -------------------------------------------------------------------------- */
/*                                 SEND DRAFT                                 */
/* -------------------------------------------------------------------------- */

export const sendDraftSchema = z.object({
  id: z.string().min(1, "Draft ID is required"),
});

export type SendDraftInput = z.infer<typeof sendDraftSchema>;
