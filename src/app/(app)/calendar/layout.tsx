import { auth } from "@clerk/nextjs/server";
import { hasPlugin } from "@/lib/hasPlugin";
import { ConnectCalendarScreen } from "@/components/ConnectCalendarScreen";

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const valid = await hasPlugin(userId, "googlecalendar");

  if (!valid) {
    return <ConnectCalendarScreen />;
  }

  return (
    <main className="flex-1 overflow-y-auto relative flex flex-col">
      {children}
    </main>
  );
}