"use client";

import { useState, useEffect } from "react";
import { useEmail } from "@/lib/hooks/useEmails";
import {
  useCreateDraft,
  useUpdateDraft,
  useSendDraft,
} from "@/lib/hooks/useDrafts";
import { useToast } from "@/lib/hooks/useToast";
import { EmailDetailSkeleton } from "@/components/LoadingSkeleton";
import { useRouter } from "next/navigation";

interface ComposeOverlayProps {
  /** If set, we're editing an existing draft (the Gmail draft ID). */
  draftId: string | null;
  /** The message ID to fetch content for (from the draft's embedded message). */
  messageId: string | null;
  onClose: () => void;
}

export function ComposeOverlay({
  draftId,
  messageId,
  onClose,
}: ComposeOverlayProps) {
  const router = useRouter();
  const { addToast } = useToast();

  // Fetch existing draft content if editing
  const { data: existingDraft, isLoading: isDraftLoading } = useEmail(
    draftId ? messageId : null
  );

  const { mutate: createDraft, isPending: isCreating } = useCreateDraft();
  const { mutate: updateDraft, isPending: isUpdating } = useUpdateDraft();
  const { mutate: sendDraft, isPending: isSending } = useSendDraft();

  const isEditing = !!draftId;
  const isPending = isCreating || isUpdating || isSending;

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Pre-fill form when existing draft loads
  useEffect(() => {
    if (existingDraft) {
      setTo(existingDraft.to || "");
      setCc(existingDraft.cc || "");
      setBcc(existingDraft.bcc || "");
      setSubject(
        existingDraft.subject === "(No Subject)" ? "" : existingDraft.subject || ""
      );
      setBody(existingDraft.textBody || existingDraft.htmlBody || "");
    }
  }, [existingDraft]);

  const handleClose = () => {
    onClose();
    router.push("/email/drafts");
  };

  const handleSave = () => {
    const payload = {
      to: to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      cc: cc
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      bcc: bcc
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
      subject,
      body,
    };

    if (isEditing && draftId) {
      updateDraft(
        { draftId, ...payload },
        {
          onSuccess: () => addToast("success", "Draft saved"),
          onError: () => addToast("error", "Failed to save draft"),
        }
      );
    } else {
      createDraft(payload, {
        onSuccess: () => {
          addToast("success", "Draft created");
          handleClose();
        },
        onError: () => addToast("error", "Failed to create draft"),
      });
    }
  };

  const handleSend = () => {
    if (!draftId) {
      addToast("error", "Save the draft first before sending");
      return;
    }
    sendDraft(draftId, {
      onSuccess: () => {
        addToast("success", "Sent!");
        handleClose();
      },
      onError: () => addToast("error", "Failed to send"),
    });
  };

  if (isEditing && isDraftLoading) {
    return (
      <div className="fixed inset-0 z-40 flex">
        <div className="flex-1" onClick={handleClose} />
        <div className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto border-l border-gray-200">
          <EmailDetailSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/30 animate-fade-in" onClick={handleClose} />

      {/* Compose panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col border-l border-gray-200 animate-overlay-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-lg"
          >
            ✕
          </button>
          <span className="text-sm font-medium text-gray-600">
            {isEditing ? "Edit Draft" : "New Message"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreating || isUpdating ? "Saving..." : "Save"}
            </button>
            {isEditing && (
              <button
                onClick={handleSend}
                disabled={isPending}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center border-b pb-2">
            <label className="w-12 text-sm text-gray-500 flex-shrink-0">To:</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="flex-1 outline-none text-sm"
            />
          </div>

          <div className="flex items-center border-b pb-2">
            <label className="w-12 text-sm text-gray-500 flex-shrink-0">Cc:</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="cc@email.com"
              className="flex-1 outline-none text-sm"
            />
          </div>

          <div className="flex items-center border-b pb-2">
            <label className="w-12 text-sm text-gray-500 flex-shrink-0">Bcc:</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="bcc@email.com"
              className="flex-1 outline-none text-sm"
            />
          </div>

          <div className="flex items-center border-b pb-2">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="flex-1 outline-none text-sm"
            />
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message..."
            className="w-full min-h-[300px] outline-none text-sm resize-none"
          />
        </div>
      </div>
    </div>
  );
}
