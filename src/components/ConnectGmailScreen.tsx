"use client";

export function ConnectGmailScreen() {
  return (
    <div className="flex-1 flex items-center justify-center px-8 py-12">
      <div className="w-full max-w-2xl">
        <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-[#12161d]">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#5c4dff]/10 via-transparent to-transparent" />

          <div className="relative p-10 md:p-12">
            {/* Icon */}
            <div className="mb-8 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-[#5c4dff]/30 bg-[#5c4dff]/10">
                <svg
                  className="h-10 w-10 text-[#5c4dff]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.75"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Connect Gmail
              </h1>

              <p className="mt-4 text-base leading-7 text-[#8b949e] max-w-lg mx-auto">
                Connect your Gmail account to access your inbox, drafts,
                reminders, and real-time email updates from a single workspace.
              </p>
            </div>

            {/* Features */}
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-800 bg-[#0e1116] p-4">
                <div className="mb-2 text-sm font-medium text-white">
                  Inbox Access
                </div>
                <div className="text-sm text-[#8b949e]">
                  Read and manage your emails.
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-[#0e1116] p-4">
                <div className="mb-2 text-sm font-medium text-white">
                  Draft Management
                </div>
                <div className="text-sm text-[#8b949e]">
                  Create and update drafts instantly.
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-[#0e1116] p-4">
                <div className="mb-2 text-sm font-medium text-white">
                  Smart Reminders
                </div>
                <div className="text-sm text-[#8b949e]">
                  Get notified when emails need attention.
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 flex justify-center">
              <a
                href="/api/connect?plugin=gmail"
                className="inline-flex items-center gap-2 rounded-xl bg-[#5c4dff] px-6 py-3 font-medium text-white transition-all hover:bg-[#6a5cff]"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>

                Connect Gmail
              </a>
            </div>

            <p className="mt-4 text-center text-xs text-[#6e7681]">
              Secure OAuth connection. Access can be revoked at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}