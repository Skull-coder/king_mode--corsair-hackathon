import {z} from "zod"

const emailSchema = z.email();

export const sendMessageInputModel = z.object({
        to: z.array(emailSchema),
        cc: z.array(emailSchema),
        bcc: z.array(emailSchema),
        subject: z.string().min(1),
        body: z.string().min(1),
})

export type SendMessageInput = z.infer<typeof sendMessageInputModel>