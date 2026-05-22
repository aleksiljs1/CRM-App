import { AppSidebar } from "@/components/sidebar";
import { ChatPopup } from "@/components/chat-popup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {children}
      </main>
      <ChatPopup />
    </div>
  );
}
