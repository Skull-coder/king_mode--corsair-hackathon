import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/Toast";
import { ComposeFAB } from "@/components/ComposeFAB"; // IMPORT THIS

export const metadata: Metadata = {
  title: "HackFlow Email",
};

export default function EmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ToastProvider>
    //   <div className="flex h-screen bg-[#0e1116] text-white overflow-hidden font-sans">
    //     <Sidebar />
        
    //     <main className="flex-1 overflow-y-auto relative flex flex-col">
    //       {children}
    //     </main>
        <>
          <main className="flex-1 overflow-y-auto relative flex flex-col">
          {children}
         </main>
        {/* Inject the FAB and Modal logic here
        <ComposeFAB /> */}
        </>
    //   </div>
    //   <ToastContainer />
    // </ToastProvider>
  );
}