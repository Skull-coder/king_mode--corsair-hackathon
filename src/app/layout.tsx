import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";
import { ToastProvider } from "@/lib/hooks/useToast";
import { Sidebar } from "@/components/Sidebar";
import { ComposeFAB } from "@/components/ComposeFAB";
import { ToastContainer } from "@/components/Toast";

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
        
                <ToastProvider>
                  <div className="flex h-screen bg-[#0e1116] text-white overflow-hidden font-sans">
                    <Sidebar />
                    
                    <main className="flex-1 overflow-y-auto relative flex flex-col">
                      {children}
                    </main>
            
                    {/* Inject the FAB and Modal logic here */}
                    <ComposeFAB />
                    
                  </div>
                  <ToastContainer />
                </ToastProvider>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
