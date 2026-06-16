"use client";

import { useState, useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/hooks/useToast";

interface HotkeyRow {
  action: string;
  description: string;
  keys: string[];
}

interface HotkeyCategory {
  title: string;
  description: string;
  items: HotkeyRow[];
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { addToast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState("openrouter");
  const [modelName, setModelName] = useState("google/gemma-4-31b-it:free");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("king_api_key") || "";
      const savedProvider = localStorage.getItem("king_provider") || "openrouter";
      const savedModel = localStorage.getItem("king_model_name") || "google/gemma-4-31b-it:free";
      
      setApiKey(savedKey);
      setProvider(savedProvider);
      setModelName(savedModel);
    }
  }, []);

  const handleSaveKeys = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("king_api_key", apiKey.trim());
      localStorage.setItem("king_provider", provider);
      localStorage.setItem("king_model_name", modelName.trim());
      addToast("success", "API Key configuration saved successfully!");
    }
  };

  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider);
    if (newProvider === "openai") {
      setModelName("gpt-4o-mini");
    } else if (newProvider === "gemini") {
      setModelName("gemini-1.5-flash");
    } else if (newProvider === "openrouter") {
      setModelName("google/gemma-4-31b-it:free");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/sign-in");
    } catch (err) {
      console.error("Failed to sign out:", err);
      setIsLoggingOut(false);
    }
  };

  const hotkeyCategories: HotkeyCategory[] = [
    {
      title: "Global Navigation",
      description: "Quickly hop between pages from anywhere in the application.",
      items: [
        { action: "Go to Inbox", description: "Navigate to your email inbox list", keys: ["Shift", "I"] },
        { action: "Go to Sent", description: "Navigate to sent emails page", keys: ["Shift", "S"] },
        { action: "Go to Drafts", description: "Navigate to draft emails page", keys: ["Shift", "D"] },
        { action: "Go to Reminders", description: "Navigate to email reminders list", keys: ["Shift", "R"] },
        { action: "Go to Calendar", description: "Navigate to the Google Calendar view", keys: ["Shift", "C"] },
        { action: "Go to KING MODE", description: "Navigate to the Sovereign AI Executor page", keys: ["Shift", "K"] },
      ],
    },
    {
      title: "Email & Compose Operations",
      description: "Create, reply, and send messages with speed.",
      items: [
        { action: "Compose Email", description: "Open the compose modal from any screen", keys: ["Shift", "P"] },
        { action: "Send Email / Reply", description: "Send current reply in detail view", keys: ["Ctrl", "Enter"] },
        { action: "Switch to Draft Tab", description: "Toggle to draft options in Quick Create modal", keys: ["Left Arrow"] },
      ],
    },
    {
      title: "Calendar & Event Operations",
      description: "Manage events and quick scheduler actions.",
      items: [
        { action: "Create Event / Send", description: "Submit the event form in Create modals", keys: ["Ctrl", "Enter"] },
        { action: "Switch to Event Tab", description: "Toggle to event options in Quick Create modal", keys: ["Right Arrow"] },
        { action: "Close Active Modals", description: "Close active calendar creation and quick create dialogues", keys: ["Escape"] },
      ],
    },
    {
      title: "King Mode Chatbot",
      description: "Operate the Sovereign AI Executor with conversational hotkeys.",
      items: [
        { action: "Send AI Prompt", description: "Execute operations with Gmail & Calendar", keys: ["Enter"] },
        { action: "Insert Newline", description: "Type multi-line commands inside prompt area", keys: ["Shift", "Enter"] },
      ],
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0e1116] text-white overflow-y-auto">
      <div className="p-8 max-w-5xl w-full mx-auto pb-16">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-sm text-[#8b949e] mt-1.5">
            Manage your account connections, global hotkeys, and app workspace parameters.
          </p>
        </div>

        {/* Hotkeys Section */}
        <div className="mb-10 bg-[#151821] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-gray-800/80">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-[#5c4dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-[#8b949e] mt-1">
              Maximize efficiency by navigating and executing commands directly with react-hotkeys.
            </p>
          </div>

          <div className="divide-y divide-gray-800/50">
            {hotkeyCategories.map((category) => (
              <div key={category.title} className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-200">{category.title}</h3>
                  <p className="text-xs text-[#8b949e]">{category.description}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
                        <th className="py-2.5 pb-2 font-medium">Action</th>
                        <th className="py-2.5 pb-2 font-medium">Description</th>
                        <th className="py-2.5 pb-2 font-medium text-right pr-4">Shortcut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/40">
                      {category.items.map((item) => (
                        <tr key={item.action} className="group hover:bg-[#1c1f2b]/30 transition-colors">
                          <td className="py-3 font-medium text-gray-300 group-hover:text-white transition-colors">
                            {item.action}
                          </td>
                          <td className="py-3 text-xs text-[#8b949e] group-hover:text-gray-300 transition-colors">
                            {item.description}
                          </td>
                          <td className="py-3 text-right pr-4">
                            <div className="inline-flex gap-1.5 justify-end items-center">
                              {item.keys.map((key, keyIdx) => (
                                <span key={keyIdx} className="inline-flex items-center">
                                  <kbd className="px-2 py-1 bg-[#0e1116] border border-gray-700/60 rounded-md font-mono text-[11px] font-semibold text-gray-300 shadow-sm min-w-[24px] text-center">
                                    {key}
                                  </kbd>
                                  {keyIdx < item.keys.length - 1 && (
                                    <span className="text-[#8b949e] text-xs px-1 font-semibold">+</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BYOK Section */}
        <div className="mb-10 bg-[#151821] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-[#5c4dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m-9 0a2 2 0 012-2m9 9a2 2 0 012 2m-9 0a2 2 0 012-2m3-6a3 3 0 100-6 3 3 0 000 6zm-3 0a3 3 0 100-6 3 3 0 000 6zm0 6a3 3 0 100-6 3 3 0 000 6zm3 0a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            Bring Your Own Key (BYOK)
          </h2>
          <p className="text-xs text-[#8b949e] mb-6">
            Configure your own custom LLM provider, API key, and model name to run King Mode.
          </p>

          <div className="space-y-4 max-w-xl">
            {/* Provider */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">API Provider</label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="px-4 py-2.5 bg-[#0e1116] border border-gray-800 focus:border-[#5c4dff] rounded-xl text-sm text-white focus:outline-none transition-colors"
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Google Gemini (API Studio)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="px-4 py-2.5 bg-[#0e1116] border border-gray-800 focus:border-[#5c4dff] rounded-xl text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            {/* Model Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-300">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. gpt-4o, gemini-1.5-pro, google/gemma-4-31b-it:free"
                className="px-4 py-2.5 bg-[#0e1116] border border-gray-800 focus:border-[#5c4dff] rounded-xl text-sm text-white focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={handleSaveKeys}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-[#5c4dff] hover:bg-[#4b3ce6] text-white rounded-xl text-sm font-semibold transition-colors duration-200"
            >
              Save Configuration
            </button>
          </div>
        </div>

        {/* Account Management Card */}
        <div className="bg-[#151821] border border-gray-800/80 rounded-2xl overflow-hidden shadow-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* User details */}
            <div className="flex items-center space-x-4">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User Profile"}
                  className="w-14 h-14 rounded-full border border-gray-700/80 shadow-md object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-full border border-[#284d7d] flex items-center justify-center text-xl font-bold bg-[#1e3a5f] text-[#60a5fa] shadow-md">
                  {user?.firstName?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <h3 className="text-base font-semibold text-white">
                  {user?.fullName || "Active User"}
                </h3>
                <p className="text-xs text-[#8b949e] mt-0.5">
                  {user?.primaryEmailAddress?.emailAddress || "Authorized via Clerk"}
                </p>
                <div className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-[#5c4dff]/10 border border-[#5c4dff]/20 rounded-full text-[10px] text-[#5c4dff] font-medium">
                  <span className="w-1.5 h-1.5 bg-[#5c4dff] rounded-full animate-pulse"></span>
                  Active Session
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ea4335]/10 hover:bg-[#ea4335]/20 border border-[#ea4335]/30 hover:border-[#ea4335]/60 text-[#ea4335] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm hover:shadow-[#ea4335]/5"
              >
                {isLoggingOut ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#ea4335]" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing out...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
