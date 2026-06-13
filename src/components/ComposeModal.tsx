"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/lib/hooks/useToast";
import { useQueryClient } from "@tanstack/react-query";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Prefill fields when editing an existing draft */
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  /** If set, we're editing an existing draft. Used for update + send. */
  draftId?: string;
}

export function ComposeModal({
  isOpen,
  onClose,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  draftId,
}: ComposeModalProps) {
  const { addToast } = useToast();
  const qc = useQueryClient();
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setTo(initialTo);
      setSubject(initialSubject);
      setBody(initialBody);
    }
  }, [isOpen, initialTo, initialSubject, initialBody]);

  if (!isOpen) return null;

  const handleSaveDraft = async () => {
    if (!to && !subject && !body) {
      addToast("error", "Cannot save an empty draft");
      return;
    }

    setIsSubmitting(true);
    try {
      if (draftId) {
        // Update existing draft
        const res = await fetch(`/api/drafts/${draftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body }),
        });
        if (!res.ok) throw new Error("Failed to update draft");
        addToast("success", "Draft updated");
      } else {
        // Create new draft
        const res = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body }),
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
      if (draftId) {
        // Send existing draft directly
        const sendRes = await fetch(`/api/drafts/${draftId}/send`, { method: "POST" });
        if (!sendRes.ok) throw new Error("Failed to send");
      } else {
        // Create draft then send
        const draftRes = await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, body }),
        });
        if (!draftRes.ok) throw new Error("Failed to prepare email");
        const draft = await draftRes.json();
        const sendRes = await fetch(`/api/drafts/${draft.id}/send`, { method: "POST" });
        if (!sendRes.ok) throw new Error("Failed to send email");
      }

      addToast("success", "Email sent!");
      qc.invalidateQueries({ queryKey: ["drafts"] });
      qc.invalidateQueries({ queryKey: ["emails"] });
      onClose();
    } catch {
      addToast("error", "Failed to send email");
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
          <div className="flex items-center gap-4 text-sm">
            <label className="text-[#8b949e] w-12 font-medium">To</label>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="<receiver_email_address>"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="flex-1 bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] transition-colors"
              />
              <button className="p-2.5 bg-[#0e1116] border border-gray-800 rounded-lg text-[#8b949e] hover:text-white hover:border-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </button>
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
  );
}