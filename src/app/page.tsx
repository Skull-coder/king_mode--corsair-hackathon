"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

export default function LandingPage() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-[#0e1116] text-white flex flex-col font-sans overflow-x-hidden selection:bg-[#5c4dff]/30 selection:text-white">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#5c4dff]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#ea4335]/3 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navbar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 h-20 flex items-center justify-between border-b border-gray-800/40 backdrop-blur-md bg-[#0e1116]/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5c4dff] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#5c4dff]/20">
            <span className="text-xl">👑</span>
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            King Mode
          </span>
        </div>

        <nav className="flex items-center space-x-4">
          {!isLoaded ? (
            <div className="h-9 w-20 bg-gray-800/50 rounded-lg animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="text-xs text-[#8b949e] hidden sm:inline-block">
                Logged in as <span className="text-gray-200 font-medium">{user.primaryEmailAddress?.emailAddress}</span>
              </span>
              <Link
                href="/email/inbox"
                className="px-4 py-2 bg-[#5c4dff]/10 hover:bg-[#5c4dff]/20 border border-[#5c4dff]/30 text-white rounded-xl text-sm font-semibold transition-all duration-200"
              >
                Go to Workspace
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-[#8b949e] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-[#5c4dff] hover:bg-[#4b3ce6] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-md shadow-[#5c4dff]/10"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 flex flex-col justify-center items-center py-20 text-center">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#5c4dff]/10 border border-[#5c4dff]/20 rounded-full text-xs text-[#8b80ff] font-medium mb-6 animate-fade-in">
          <span className="w-1.5 h-1.5 bg-[#5c4dff] rounded-full animate-ping"></span>
          Superhuman Gmail & Calendar Workflows
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6">
          Take Command in{" "}
          <span className="bg-gradient-to-r from-[#5c4dff] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
            King Mode
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-[#8b949e] max-w-2xl leading-relaxed mb-10">
          A lightning-fast, keyboard-driven inbox and calendar client equipped with a Sovereign AI Executor to handle your email and schedule operations in natural language.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16 justify-center w-full max-w-md">
          {user ? (
            <Link
              href="/email/inbox"
              className="flex-1 px-8 py-4 bg-gradient-to-r from-[#5c4dff] to-[#8b5cf6] hover:from-[#4b3ce6] hover:to-[#7c3aed] text-white rounded-2xl font-bold transition-all duration-200 shadow-lg shadow-[#5c4dff]/20 flex items-center justify-center gap-2 group"
            >
              Enter Workspace
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <>
              <Link
                href="/sign-up"
                className="flex-1 px-8 py-4 bg-gradient-to-r from-[#5c4dff] to-[#8b5cf6] hover:from-[#4b3ce6] hover:to-[#7c3aed] text-white rounded-2xl font-bold transition-all duration-200 shadow-lg shadow-[#5c4dff]/20 flex items-center justify-center"
              >
                Claim Your Account
              </Link>
              <Link
                href="/sign-in"
                className="flex-1 px-8 py-4 bg-[#151821] hover:bg-[#1c1f2b] border border-gray-800 hover:border-gray-700 text-gray-200 hover:text-white rounded-2xl font-bold transition-all duration-200 flex items-center justify-center"
              >
                Sign In
              </Link>
            </>
          )}
        </div>

        {/* Feature Preview Showcase */}
        <div className="w-full max-w-5xl bg-[#151821] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl p-8 text-left relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-[#5c4dff]/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {/* Feature 1 */}
            <div className="flex flex-col space-y-3 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center text-lg">
                ⚡
              </div>
              <h3 className="font-semibold text-lg text-white">Sovereign AI Executor</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Connect your accounts and let King Mode do the work. Draft replies, query calendar events, or check schedules using simple, direct chat instructions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col space-y-3 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center text-lg">
                ⌨️
              </div>
              <h3 className="font-semibold text-lg text-white">Keyboard-First Interface</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                Fly through your emails and calendar without your hands leaving the keys. Leverage reactive react-hotkeys bindings for blazing-fast navigation.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col space-y-3 p-4 rounded-xl hover:bg-white/[0.02] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[#5c4dff]/10 border border-[#5c4dff]/20 flex items-center justify-center text-lg">
                📅
              </div>
              <h3 className="font-semibold text-lg text-white">Integrated Scheduler</h3>
              <p className="text-sm text-[#8b949e] leading-relaxed">
                No more context switching. Schedule Google Calendar events directly beside your inbox with quick overlays and automatic timezone parsing.
              </p>
            </div>
          </div>

          {/* Quick Hotkey Cheat Sheet Preview inside dashboard */}
          <div className="mt-8 pt-6 border-t border-gray-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Inbox</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">I</kbd>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">King Mode AI</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">K</kbd>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Calendar</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">C</kbd>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider">Compose Email</span>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">Shift</kbd>
                <span className="text-xs text-[#8b949e]">+</span>
                <kbd className="px-1.5 py-0.5 bg-[#0e1116] border border-gray-800 rounded text-[10px] font-mono text-gray-300">P</kbd>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-8 border-t border-gray-800/40 text-center text-xs text-[#8b949e]">
        <p>&copy; {new Date().getFullYear()} King Mode. All rights reserved. Secured via Clerk Authentication.</p>
      </footer>
    </div>
  );
}
