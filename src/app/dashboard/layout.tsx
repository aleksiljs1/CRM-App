import { AppSidebar } from "@/components/sidebar";
import { ChatPopup } from "@/components/chat-popup";
import { NotificationBell } from "@/components/notification-bell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with notification bell */}
        <header className="flex h-12 shrink-0 items-center justify-end border-b bg-white px-6">
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
      <ChatPopup />
    </div>
  );
}
