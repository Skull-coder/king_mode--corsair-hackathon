import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "King Mode",
  description: "Superhuman-style Gmail & Calendar workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>
            <header className="flex justify-between items-center p-4 gap-4 h-16 border-b">
              <nav className="flex gap-4 text-sm font-medium">
                <a href="/dashboard">Dashboard</a>
                <a href="/inbox">Inbox</a>
                <a href="/drafts">Drafts</a>
                <a href="/sent">Sent</a>
                <a href="/calendar">Calendar</a>
              </nav>
              <div className="flex items-center gap-4">
                <Show when="signed-out">
                  <SignInButton />
                  <SignUpButton>
                    <button className="bg-purple-700 text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                      Sign Up
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <UserButton />
                </Show>
              </div>
            </header>
            {children}
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
