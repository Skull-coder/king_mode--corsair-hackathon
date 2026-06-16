"use client";

interface WelcomeScreenProps {
  userName?: string;
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  "What can you do for me?",
  "Summarize my recent emails",
  "Check my calendar for today",
  "Draft an email for me",
  "Search the web for latest tech news",
];

export function WelcomeScreen({ userName, onSuggestionClick }: WelcomeScreenProps) {
  const displayName = userName ?? "KING";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      {/* Crown Icon */}
      <div className="mb-6">
        <svg
          className="h-16 w-16 text-amber-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14.178 2a2 2 0 01-1.957 1.582H6.779a2 2 0 01-1.957-1.582L4 13h16l-.822 5z" />
        </svg>
      </div>

      {/* Welcome Text */}
      <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-white">
        Welcome back,{" "}
        <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">
          {displayName}
        </span>
      </h1>
      <p className="mb-10 max-w-md text-center text-base text-[#8b949e] leading-relaxed">
        How may I serve you today, Your Majesty? I have access to your emails and calendar and stand ready to carry out any task you command.
      </p>

      {/* Suggestion Chips */}
      <div className="flex max-w-xl flex-wrap items-center justify-center gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSuggestionClick(suggestion)}
            className="rounded-full border border-zinc-700/60 bg-[#151821] px-4 py-2 text-sm text-zinc-300 transition-all hover:border-amber-500/40 hover:bg-[#1a1f2e] hover:text-amber-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
