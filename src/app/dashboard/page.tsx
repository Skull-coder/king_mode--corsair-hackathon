import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { emails } from "@/lib/db/schema/users";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch the latest emails, directly from your fully-synced database
  const recentEmails = await db
    .select()
    .from(emails)
    .where(eq(emails.userId, userId))
    .orderBy(desc(emails.receivedAt))
    .limit(20);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">AI Inbox Triage</h1>
      
      {recentEmails.length === 0 ? (
        <p className="text-gray-500">No emails found. Syncing might still be in progress...</p>
      ) : (
        <div className="space-y-4">
          {recentEmails.map((email) => (
            <div key={email.id} className="border p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg text-gray-900">{email.subject}</h2>
                {/* AI Classification Badge */}
                <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full 
                  ${email.priority === 'critical' ? 'bg-red-100 text-red-700' : 
                    email.priority === 'important' ? 'bg-orange-100 text-orange-700' : 
                    email.priority === 'newsletter' ? 'bg-purple-100 text-purple-700' :
                    email.priority === 'low' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'}`}>
                  {email.priority}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600 mb-3">From: {email.sender}</p>
              <p className="text-sm text-gray-500 line-clamp-2">{email.bodySnippet}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}