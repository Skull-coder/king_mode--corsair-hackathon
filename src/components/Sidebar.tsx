"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const navItems = [
  {
    href: "/email",
    label: "Email",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    href: "/king",
    label: "KING MODE",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 7l4 6 5-8 5 8 4-6v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const initials =
    user?.firstName?.charAt(0)?.toUpperCase() ||
    user?.fullName?.charAt(0)?.toUpperCase() ||
    "?";

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-800 bg-[#0e1116] flex flex-col justify-between p-4 h-full">
      <div>
        {/* User Profile — from Clerk */}
        <div className="flex items-center space-x-3 mb-8 p-2 hover:bg-gray-800/50 rounded-xl cursor-pointer transition-colors group">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName || "User"}
              className="w-10 h-10 rounded-full border border-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full border border-[#284d7d] flex items-center justify-center text-lg font-semibold bg-[#1e3a5f] text-[#60a5fa]">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-white">
              {user?.fullName || user?.firstName || "User"}
            </h2>
            <p className="text-xs text-[#8b949e] truncate">
              {user?.primaryEmailAddress?.emailAddress || ""}
            </p>
          </div>
          <svg
            className="w-4 h-4 text-[#8b949e] group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            // Check if active (e.g. /email/inbox or /email/drafts both light up the "Email" tab)
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href === "/email" ? "/email/inbox" : item.href} // default email link to inbox
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#151821] border border-gray-700/50 text-white shadow-sm"
                    : "text-[#8b949e] hover:text-white hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings */}
      <Link
        href="/settings"
        className="flex items-center space-x-3 p-3 text-sm font-medium text-[#8b949e] hover:text-white hover:bg-gray-800/50 rounded-xl transition-colors border border-transparent"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>Settings</span>
      </Link>
    </aside>
  );
}
