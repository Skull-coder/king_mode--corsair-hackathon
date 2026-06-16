import { Sidebar } from "@/components/Sidebar";
import { ComposeFAB } from "@/components/ComposeFAB";
import { ToastContainer } from "@/components/Toast";
import { GlobalShortcutsProvider } from "@/components/GlobalShortcutsProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#0e1116] text-white overflow-hidden font-sans">
      <Sidebar />

      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <GlobalShortcutsProvider />
        {children}
      </main>

      <ComposeFAB />
      <ToastContainer />
    </div>
  );
}
