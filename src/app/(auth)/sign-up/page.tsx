"use client";

import { SignUp } from "@clerk/nextjs";

// const appearance = {
//   elements: {
//     card: "bg-[#151821] border border-gray-800/80 rounded-2xl shadow-2xl shadow-black/30",
//     headerTitle: "text-white text-xl font-semibold",
//     headerSubtitle: "text-[#8b949e] text-sm",
//     formFieldLabel: "text-[#8b949e] text-xs font-medium uppercase tracking-wider",
//     formFieldInput:
//       "bg-[#0e1116] border border-gray-800 rounded-lg px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#5c4dff] focus:ring-1 focus:ring-[#5c4dff]/30 text-sm transition-colors",
//     formButtonPrimary:
//       "bg-[#5c4dff] hover:bg-[#4b3be0] text-white text-sm font-semibold rounded-lg px-6 py-2.5 transition-colors shadow-lg shadow-[#5c4dff]/20",
//     footer: "bg-transparent",
//     footerActionText: "text-[#8b949e] text-sm",
//     footerActionLink:
//       "text-[#5c4dff] hover:text-[#7b6dff] text-sm font-medium transition-colors",
//     socialButtonsBlockButton:
//       "bg-[#0e1116] border border-gray-800 rounded-lg text-white hover:bg-[#1a1d27] transition-colors",
//     dividerLine: "bg-gray-800",
//     dividerText: "text-[#8b949e] text-xs",
//     identityPreviewText: "text-white",
//     identityPreviewEditButton: "text-[#5c4dff] hover:text-[#7b6dff]",
//     formFieldInputShowPasswordButton: "text-[#8b949e]",
//     formFieldAction: "text-[#5c4dff] hover:text-[#7b6dff] text-sm",
//     alert: "bg-transparent border border-red-800/50 text-red-400",
//     alertText: "text-red-400",
//     formResendCodeLink: "text-[#5c4dff] hover:text-[#7b6dff]",
//     otpCodeFieldInput:
//       "bg-[#0e1116] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-[#5c4dff]",
//   },
//   variables: {
//     colorPrimary: "#5c4dff",
//     colorBackground: "#151821",
//     colorInputBackground: "#0e1116",
//     colorInputText: "#ffffff",
//     colorText: "#e5e7eb",
//     colorTextSecondary: "#8b949e",
//     colorDanger: "#ef4444",
//   },
// };

export default function SignUpPage() {
  return (
    <SignUp
  routing="hash"
  signInUrl="/sign-in"
  fallbackRedirectUrl="/email/inbox"
/>
  );
}
