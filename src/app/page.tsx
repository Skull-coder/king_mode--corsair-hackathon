"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-[#0e1116] text-[#e5e7eb] flex flex-col font-sans overflow-x-hidden selection:bg-[#5c4dff]/30 selection:text-white">
      {/* Premium Ambient Backgrounds */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#5c4dff]/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#8b5cf6]/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Modern Glass Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#0e1116]/80 backdrop-blur-xl">
        <div className="max-w-7xl w-full mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#5c4dff] flex items-center justify-center shadow-[0_0_15px_rgba(92,77,255,0.4)] group-hover:shadow-[0_0_20px_rgba(92,77,255,0.6)] transition-all">
              <svg className="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              King Mode
            </span>
          </div>

          <nav className="flex items-center space-x-4">
            {!isLoaded ? (
              <div className="h-8 w-24 bg-white/[0.05] rounded-md animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-5">
                <span className="text-sm text-[#8b949e] hidden sm:inline-block">
                  <span className="text-gray-300 font-medium">{user.primaryEmailAddress?.emailAddress}</span>
                </span>
                <Link
                  href="/email/inbox"
                  className="px-4 py-2 bg-white text-black hover:bg-gray-100 rounded-lg text-sm font-semibold transition-all duration-200"
                >
                  Enter Workspace
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-[#8b949e] hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-[#5c4dff] hover:bg-[#4b3ce6] text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md shadow-[#5c4dff]/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col mt-16">
        
        {/* Hero Section */}
        <section className="max-w-7xl w-full mx-auto px-6 pt-32 pb-24 flex flex-col items-center text-center">
          {/* Announcement Pill */}
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-gray-300 mb-8 hover:bg-white/[0.06] transition-colors group">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#5c4dff] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#5c4dff]"></span>
            </span>
            <span>King Mode Beta is now live</span>
            <svg className="w-3.5 h-3.5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Link>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] text-white mb-6">
            The executive command center for your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5c4dff] to-[#ec4899]">inbox & calendar</span>
          </h1>

          <p className="text-lg md:text-xl text-[#8b949e] max-w-2xl leading-relaxed mb-10">
            A lightning-fast, keyboard-driven client engineered for operators. Outfitted with a Sovereign AI Executor to manage scheduling and emails in natural language.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            {user ? (
              <Link
                href="/email/inbox"
                className="flex-1 px-8 py-3.5 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                Go to Workspace
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-up"
                  className="flex-1 px-8 py-3.5 bg-white text-black hover:bg-gray-100 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  Start for free
                </Link>
                <Link
                  href="/sign-in"
                  className="flex-1 px-8 py-3.5 bg-transparent border border-white/[0.1] hover:bg-white/[0.03] text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Product UI Preview / Dashboard Mock */}
        <section className="max-w-6xl w-full mx-auto px-6 pb-32">
          <div className="w-full h-auto aspect-[16/9] bg-[#111319] rounded-2xl border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(92,77,255,0.2)] overflow-hidden flex flex-col relative">
            <div className="h-10 bg-[#0e1116] border-b border-white/[0.08] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="mx-auto flex gap-2 items-center text-[11px] font-medium text-[#8b949e] bg-[#151821] px-4 py-1.5 rounded-md border border-white/[0.05]">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                kingmode.app
              </div>
            </div>
            
            {/* Minimalist Grid inside the preview window */}
            <div className="flex-1 bg-gradient-to-b from-[#11141c] to-[#0e1116] p-8 md:p-12 relative overflow-hidden">
               {/* Faint grid background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 h-full">
                {/* Feature 1 */}
                <div className="bg-[#151821]/80 backdrop-blur-sm border border-white/[0.05] p-6 rounded-2xl hover:border-white/[0.1] transition-colors flex flex-col">
                  <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[#8b80ff]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Sovereign AI Executor</h3>
                  <p className="text-sm text-[#8b949e] leading-relaxed flex-1">
                    Connect your accounts and let King Mode do the work. Draft replies or manage events using simple, direct chat instructions.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#151821]/80 backdrop-blur-sm border border-white/[0.05] p-6 rounded-2xl hover:border-white/[0.1] transition-colors flex flex-col translate-y-0 md:translate-y-6">
                  <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[#8b80ff]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" ry="2"/>
                      <path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/><path d="M8 12h.01"/><path d="M12 12h.01"/><path d="M16 12h.01"/><path d="M7 16h10"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Keyboard-First UI</h3>
                  <p className="text-sm text-[#8b949e] leading-relaxed flex-1">
                    Fly through your emails without leaving the home row. Built with reactive hotkey bindings for blazing-fast navigation.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#151821]/80 backdrop-blur-sm border border-white/[0.05] p-6 rounded-2xl hover:border-white/[0.1] transition-colors flex flex-col">
                  <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-[#8b80ff]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                      <line x1="16" x2="16" y1="2" y2="6"/>
                      <line x1="8" x2="8" y1="2" y2="6"/>
                      <line x1="3" x2="21" y1="10" y2="10"/>
                      <path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/>
                    </svg>
                  </div>
                  <h3 className="text-white font-semibold mb-2">Integrated Scheduler</h3>
                  <p className="text-sm text-[#8b949e] leading-relaxed flex-1">
                    No more context switching. Schedule Google Calendar events directly beside your inbox with automatic timezone parsing.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick hotkeys bar at the bottom of the preview window */}
            <div className="h-14 bg-[#111319] border-t border-white/[0.05] flex items-center px-6 gap-6 overflow-x-auto">
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8b949e]">Shortcuts:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">I</kbd>
                <span className="text-[11px] text-[#8b949e] ml-1">Inbox</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">C</kbd>
                <span className="text-[11px] text-[#8b949e] ml-1">Calendar</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">P</kbd>
                <span className="text-[11px] text-[#8b949e] ml-1">Compose</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#1a1d24] border border-white/[0.08] rounded text-[10px] font-mono text-gray-300">K</kbd>
                <span className="text-[11px] text-[#8b949e] ml-1">King Mode AI</span>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[#0e1116] py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[4px] bg-[#5c4dff] flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">King Mode</span>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-[#8b949e]">
            <span>Powered by</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded text-gray-300">Next.js</span>
              <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded text-gray-300">Clerk</span>
              <span className="px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded text-gray-300">Corsair</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="text-xs text-[#8b949e] hover:text-white transition-colors">Privacy Policy</Link>
            <p className="text-xs text-[#8b949e]">&copy; {new Date().getFullYear()} King Mode. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
