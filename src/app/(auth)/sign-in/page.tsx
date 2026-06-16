"use client";

import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#5c4dff",
    colorBackground: "#151821",
    colorInputBackground: "#0e1116",
    colorInputText: "#ffffff",
    colorText: "#f3f4f6",
    colorTextSecondary: "#8b949e",
    colorDanger: "#ef4444",

    borderRadius: "12px",
  },

  elements: {
    rootBox: "mx-auto",

    card: `
      bg-[#151821]
      border border-gray-800
      rounded-2xl
      shadow-2xl
      shadow-black/30
    `,

    headerTitle: "text-white font-semibold",
    headerSubtitle: "text-[#8b949e]",

    socialButtonsBlockButton: `
      bg-[#0e1116]
      border border-gray-800
      text-white
      hover:bg-[#1a1d27]
    `,

    formFieldInput: `
      bg-[#0e1116]
      border border-gray-800
      text-white
    `,

    formButtonPrimary: `
      bg-[#5c4dff]
      hover:bg-[#4b3be0]
      text-white
      font-medium
    `,

    footerActionLink:
      "text-[#5c4dff] hover:text-[#7b6dff]",

    dividerText: "text-[#8b949e]",
    dividerLine: "bg-gray-800",
  },
};
export default function SignInPage() {
  return (
    <SignIn
    appearance={appearance}
  routing="hash"
  signUpUrl="/sign-up"
  fallbackRedirectUrl="/email/inbox"
/>
  );
}
