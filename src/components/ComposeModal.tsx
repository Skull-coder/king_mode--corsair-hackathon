"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateReminder } from "@/lib/hooks/use-reminders"; // ← new import

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTo?: string;
  initialCc?: string;
  initialBcc?: string;
  initialSubject?: string;
  initialBody?: string;
  draftId?: string;
}

// ─── Reminder chip selector (same as everywhere) ───────────────────
function ReminderDropdown({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const options = [
    { label: "1 hour", value: "1h" },
    { label: "4 hours", value: "4h" },
    { label: "Tomorrow 9 AM", value: "tomorrow" },
    { label: "Monday 9 AM", value: "monday" },
    { label: "Custom…", value: "custom" },
  ];

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
            selected === opt.value
              ? "bg-[#5c4dff] text-white border-[#5c4dff]"
              : "bg-[#1a1d27] text-[#8b949e] border-gray-700 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ComposeModal({
  isOpen,
  onClose,
  initialTo = "",
  initialCc = "",
  initialBcc = "",
  initialSubject = "",
  initialBody = "",
  draftId,
}: ComposeModalProps) {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const createReminder = useCreateReminder(); // ← new hook

  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState(initialCc);
  const [bcc, setBcc] = useState(initialBcc);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Reminder state ──────────────────────────────────────────────
  const [showReminder, setShowReminder] = useState(false);
  const [remindOption, setRemindOption] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState("");

  // Reset form when modal opens (including reminder)
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setCc(initialCc);
      setBcc(initialBcc);
      setSubject(initialSubject);
      setBody(initialBody);
      setShowReminder(false);
      setRemindOption(null);
      setCustomDate("");
      if (initialCc || initialBcc) setShowCcBcc(true);
    }
  }, [isOpen, initialTo, initialCc, initialBcc, initialSubject, initialBody]);

  // Calculate remindAfter from selection
  const computeRemindAfter = (): Date | null => {
    if (!remindOption) return null;
    const now = new Date();
    switch (remindOption) {
      case "1h":
        return new Date(now.getTime() + 60 * 60 * 1000);
      case "4h":
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case "tomorrow":
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        return now;
      case "monday":
        now.setDate(now.getDate() + ((1 + 7 - now.getDay()) % 7 || 7));
        now.setHours(9, 0, 0, 0);
        return now;
      case "custom":
        return customDate ? new Date(customDate) : null;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const handleSaveDraft = async () => {
    if (!to && !subject && !body) {
      addToast("error", "Cannot save an empty draft");
      return;
    }

    setIsSubmitting(true);
    try {
      if (draftId) {
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, cc, bcc, subject, body }),
        });
        if (!res.ok) throw new Error("Failed to update draft");
        addToast("success", "Draft updated");
      } else {
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, cc, bcc, subject, body }),
        });
        if (!res.ok) throw new Error("Failed to save draft");
        addToast("success", "Draft saved");
      }
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      onClose();
    } catch {
      addToast("error", "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async () => {
    if (!to) {
      addToast("error", "Please specify a recipient");
      return;
    }

    setIsSubmitting(true);
    try {
      let threadId = "";
      let messageId = "";

      if (draftId) {
        // Send existing draft directly
        const sendRes = await fetch(`/api/drafts/${draftId}/send`, { method: "POST" });
        if (!sendRes.ok) throw new Error("Failed to send");
        const sendData = await sendRes.json().catch(() => ({}));
        threadId = sendData.threadId ?? "";
        messageId = sendData.id ?? "";
      } else {
        // Create draft then send
        const draftRes = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, cc, bcc, subject, body }),
        });
        if (!draftRes.ok) throw new Error("Failed to prepare email");
        const draft = await draftRes.json();

        const sendRes = await fetch(`/api/drafts/${draft.id}/send`, { method: "POST" });
        if (!sendRes.ok) throw new Error("Failed to send email");
        const sendData = await sendRes.json().catch(() => ({}));
        threadId = sendData.threadId ?? "";
        messageId = sendData.id ?? "";
      }

      // ─── Create reminder if configured ──────────────────────────
      if (remindOption) {
        const remindAfter = computeRemindAfter();
        if (remindAfter) {
          createReminder.mutate({
            threadId,
            sentMessageId: messageId,
            sentAt: new Date().toISOString(),
            remindAfter: remindAfter.toISOString(),
            recipientEmail: to.trim(),   // primary recipient
            subject: subject || "(No subject)",
          });
        }
      }

      addToast("success", "Email sent!");
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      onClose();
    } catch (err: any) {
      addToast("error", err.message || "Failed to send email");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Dim and Blurred Background */}
      <div 
        className="absolute inset-0 bg-[#0e1116]/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-[#151821] border border-gray-800 rounded-2xl shadow-2xl flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#5c4dff]/20 text-[#5c4dff] flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">New Email</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex flex-col gap-4">
          
          {/* To Field */}
          <div>
            <div className="flex items-center gap-4 text-sm">
              <label className="text-[#8b949e] w-12 font-medium">To</label>
              <div className="flex-1 flex items-center gap-2 relative">
                <input
                  type="text"
                  placeholder="<receiver_email_address>"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
                />
                <button
                  onClick={() => setShowCcBcc(!showCcBcc)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 pl-2 text-[#8b949e] hover:text-white transition-colors"
                  title="Add CC / BCC"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showCcBcc ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* CC / BCC dropdown */}
            <div
              className={`transition-all duration-200 ease-in-out overflow-hidden ${
                showCcBcc ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <label className="text-[#8b949e] w-12 font-medium">Cc</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@email.com"
                    className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <label className="text-[#8b949e] w-12 font-medium">Bcc</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@email.com"
                    className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Subject Field */}
          <div className="flex flex-col gap-2 text-sm">
            <label className="text-[#8b949e] font-medium">Subject</label>
            <input
              type="text"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
            />
          </div>

          {/* Body Field */}
          <div className="flex flex-col gap-2 text-sm flex-1">
            <label className="text-[#8b949e] font-medium">Body</label>
            <textarea
              placeholder="Write your message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full h-48 bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors resize-none"
            />
          </div>

          {/* ─── Reminder collapsible section ───────────────────── */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showReminder ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="border border-gray-800 rounded-lg bg-[#11141c] p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-200">
                  ⏱ Track for follow-up if no reply by…
                </h4>
                <button
                  onClick={() => {
                    setShowReminder(false);
                    setRemindOption(null);
                    setCustomDate("");
                  }}
                  className="text-xs text-[#8b949e] hover:text-gray-200"
                >
                  Remove
                </button>
              </div>
              <ReminderDropdown selected={remindOption} onSelect={setRemindOption} />
              {remindOption === "custom" && (
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="mt-2 w-full bg-[#0e1116] text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5c4dff]"
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-[#151821] rounded-b-2xl">
          <button
            onClick={handleSaveDraft}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-transparent border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Save as draft
          </button>
          
          <div className="flex items-center gap-2">
            {/* Reminder toggle button */}
            <button
              onClick={() => setShowReminder(!showReminder)}
              className={`flex items-center px-3 py-2 rounded-lg gap-2 transition-all text-sm ${
                showReminder
                  ? "bg-[#5c4dff] text-white"
                  : "text-[#8b949e] hover:text-gray-200 hover:bg-[#1a1d27]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showReminder ? "Tracking On" : "Track Follow-up"}
            </button>
            
            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 text-sm font-medium text-white bg-[#5c4dff] rounded-lg hover:bg-[#4b3be0] transition-colors shadow-lg shadow-[#5c4dff]/20 disabled:opacity-50"
            >
              <svg className="w-4 h-4 transform -rotate-45 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}