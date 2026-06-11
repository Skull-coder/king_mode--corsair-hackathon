import {createDraft, deleteDraft, updateDraft, getDraft, listDrafts, sendDraft, createReplyDraft} from "@/lib/integrations/gmail/operations/draft/index"
import { corsair } from "../corsair";

const tenantId = "user_3Et5ewXYffpTxJgBAwingvrqI1v"
const draftId = "r-8821187367892422749"
const tenant = corsair.withTenant(tenantId);


const payload = {
    to: ["krishvarma030@gmail.com"],
    cc: [],
    bcc: [],
    subject: "Sending from corsair 12",
    body: "updating a dummy draft to test update"
}

try {
    await updateDraft(tenantId, draftId, payload)
    console.log("draft created successfuly ;)")
} catch (error) {
    console.log("ERRRRRORRRRRR !!! ", error)
}