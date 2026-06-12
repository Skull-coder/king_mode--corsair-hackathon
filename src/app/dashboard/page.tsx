import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">King Mode Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/inbox" className="border p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
          <h2 className="font-bold text-lg">📥 Inbox</h2>
          <p className="text-gray-500 text-sm mt-1">View your incoming emails</p>
        </Link>
        <Link href="/drafts" className="border p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
          <h2 className="font-bold text-lg">📝 Drafts</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your drafts</p>
        </Link>
        <Link href="/sent" className="border p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
          <h2 className="font-bold text-lg">📤 Sent</h2>
          <p className="text-gray-500 text-sm mt-1">View sent emails</p>
        </Link>
        <Link href="/calendar" className="border p-6 rounded-xl hover:shadow-md transition-shadow bg-white">
          <h2 className="font-bold text-lg">📅 Calendar</h2>
          <p className="text-gray-500 text-sm mt-1">View your calendar events</p>
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/api/connect?plugin=gmail" className="text-blue-600 underline">
          Connect Gmail
        </Link>
        {" | "}
        <Link href="/api/connect?plugin=googlecalendar" className="text-blue-600 underline">
          Connect Calendar
        </Link>
      </div>
    </div>
  );
}
