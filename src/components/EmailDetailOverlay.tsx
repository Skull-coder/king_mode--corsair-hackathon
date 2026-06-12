"use client";

import type { ParsedEmail } from "@/lib/email-parser";
import { formatEmailDate } from "@/lib/email-parser";
import { useEmail, useToggleStar, useModifyEmail, useDeleteEmail } from "@/lib/hooks/useEmails";
import { useToast } from "@/lib/hooks/useToast";
import { EmailDetailSkeleton } from "@/components/LoadingSkeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Helper to match the specific avatar colors from your UI
function getAvatarStyle(name: string) {
  const char = name.charAt(0).toUpperCase();
  if (['A', 'B', 'C'].includes(char)) return 'bg-[#1a3d2e] text-[#4ade80] border-[#22523e]'; 
  if (['S', 'U', 'V'].includes(char)) return 'bg-[#3b2a59] text-[#c084fc] border-[#4b3570]'; // Purple for 'S'
  if (['R', 'P', 'Q'].includes(char)) return 'bg-[#1e3a5f] text-[#60a5fa] border-[#284d7d]'; 
  if (['T', 'W', 'Y'].includes(char)) return 'bg-[#4a3f1d] text-[#facc15] border-[#5c4f24]'; 
  return 'bg-gray-800 text-gray-300 border-gray-700'; 
}

interface EmailDetailOverlayProps {
  messageId: string;
  context: "inbox" | "sent";
  onClose: () => void;
}

export function EmailDetailOverlay({ messageId, context, onClose }: EmailDetailOverlayProps) {
  const router = useRouter();
  const { data: email, isLoading, error } = useEmail(messageId);
  const { mutate: toggleStar } = useToggleStar();
  const { mutate: modifyEmail } = useModifyEmail();
  const { mutate: deleteEmail } = useDeleteEmail();
  const { addToast } = useToast();

  const handleClose = () => {
    onClose();
    router.push(`/email/${context}`);
  };

  if (isLoading) {
    return (
      <div className="absolute inset-0 z-40 bg-[#0e1116] overflow-y-auto">
        <EmailDetailSkeleton />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="absolute inset-0 z-40 bg-[#0e1116] flex items-center justify-center">
        <div className="bg-[#151821] border border-gray-800 p-8 rounded-2xl text-center">
          <p className="text-red-400 mb-4">Failed to load email details.</p>
          <button onClick={handleClose} className="px-4 py-2 bg-[#5c4dff] text-white rounded-lg hover:bg-[#4b3be0] transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayPerson = context === "inbox" ? email.from || "Unknown Sender" : email.to || "(No Recipients)";
  // Simple extraction for visual layout (assuming formats like "Sneha Iyer <sneha.iyer@hackflow.dev>")
  const nameMatch = displayPerson.match(/^([^<]+)/);
  const emailMatch = displayPerson.match(/<([^>]+)>/);
  const displayName = nameMatch ? nameMatch[1].trim() : displayPerson;
  const displayEmailAddress = emailMatch ? emailMatch[1].trim() : displayPerson;

  return (
    <div className="absolute inset-0 z-40 bg-[#0e1116] overflow-y-auto p-8 animate-fade-in flex flex-col items-center">
      
      <div className="w-full max-w-4xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-6 font-medium">
          <Link href={`/email/${context}`} className="text-[#5c4dff] hover:text-[#7b6dff] transition-colors capitalize">
            {context}
          </Link>
          <span className="text-[#8b949e]">
            <svg className="w-3 h-3 inline-block mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            Message
          </span>
        </div>

        {/* Main Message Card */}
        <div className="bg-[#151821] border border-gray-800/80 rounded-2xl p-8 shadow-xl shadow-black/20">
          
          {/* Header row: Avatar, Name, Actions */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold flex-shrink-0 border ${getAvatarStyle(displayName)}`}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-200">{displayName}</span>
                <span className="text-sm text-[#8b949e]">{displayEmailAddress}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  toggleStar(
                    { messageId: email.id, starred: !email.isStarred },
                    { onSuccess: () => addToast("success", email.isStarred ? "Unstarred" : "Starred") }
                  );
                }}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${email.isStarred ? 'text-[#facc15]' : 'text-[#8b949e]'}`}
              >
                <svg className={`w-5 h-5 ${email.isStarred ? 'fill-current' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>

              <div className="relative group">
                <button className="p-2 rounded-full text-[#8b949e] hover:text-gray-200 hover:bg-gray-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                {/* Dropdown for Delete/Archive (Optional expansion) */}
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1d27] border border-gray-700 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                   <button 
                     onClick={() => deleteEmail(email.id, { onSuccess: () => { addToast("success", "Deleted"); handleClose(); }})}
                     className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 rounded-t-xl"
                   >
                     Delete Message
                   </button>
                   <button 
                     onClick={() => modifyEmail({ messageId: email.id, archive: true }, { onSuccess: () => { addToast("success", "Archived"); handleClose(); }})}
                     className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-800 rounded-b-xl border-t border-gray-700"
                   >
                     Archive
                   </button>
                </div>
              </div>
            </div>
          </div>

          {/* Border Divider */}
          <div className="border-t border-gray-800/80 mb-6"></div>

          {/* Subject & Meta Data */}
          <h1 className="text-2xl font-semibold text-gray-100 mb-4">
            {email.subject || "(No Subject)"}
          </h1>

          <div className="flex items-center gap-3 mb-10 text-sm">
            <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[#8b949e]">
              {formatEmailDate(email.internalDate)}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#5c4dff] mx-1"></span>
            <span className="bg-[#5c4dff]/10 border border-[#5c4dff]/20 text-[#5c4dff] px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wide">
              {context}
            </span>
          </div>

          {/* Email Body Content */}
          <div className="text-gray-300 leading-relaxed font-sans prose prose-invert max-w-none prose-a:text-[#5c4dff] hover:prose-a:text-[#7b6dff]">
            {email.htmlBody ? (
              <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
            ) : email.textBody ? (
              <pre className="whitespace-pre-wrap font-sans text-[15px]">{email.textBody}</pre>
            ) : (
              <p className="text-gray-500 italic">No body content available.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}