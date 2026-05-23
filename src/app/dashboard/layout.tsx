import { AppSidebar, MobileMenuButton } from "@/components/sidebar";
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
        {/* Top bar. On mobile shows hamburger + brand + bell; on md+ keeps
            the original right-aligned bell-only layout. */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-3 md:justify-end md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <MobileMenuButton />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Kreston logo"
              className="h-6 w-6 object-contain"
            />
            <span className="text-sm font-semibold text-foreground">
              Kreston CRM
            </span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/50 dark:bg-background p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
      <ChatPopup />
    </div>
  );
}
