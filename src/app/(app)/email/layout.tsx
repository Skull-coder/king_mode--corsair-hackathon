import type { Metadata } from "next";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { hasPlugin } from "@/lib/corsair";
import { ConnectGmailScreen } from "@/components/ConnectGmailScreen";

export const metadata: Metadata = {
  title: "HackFlow Email",
};

export default async function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}){

   const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const valid = await hasPlugin(userId, "gmail")

  if (!valid) {
    return <ConnectGmailScreen />;
  }

  return (
          <main className="flex-1 overflow-y-auto relative flex flex-col">
          {children}
         </main>
  );
}