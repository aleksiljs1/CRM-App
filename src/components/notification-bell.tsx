"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Mail,
  CheckSquare,
  FileText,
  Info,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "EMAIL" | "TASK" | "DOCUMENT" | "SYSTEM";
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail,
  TASK: CheckSquare,
  DOCUMENT: FileText,
  SYSTEM: Info,
};

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silent
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  // Poll every 30s as fallback
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session, fetchNotifications]);

  // Socket.io real-time listener
  useEffect(() => {
    if (!session?.user) return;

    const socket = getSocket();
    socket.emit("join", session.user.id);

    const handler = (notif: Notification) => {
      setNotifications((prev) => [{ ...notif, isRead: false }, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
      toast(notif.title, { description: notif.message });
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleClick = async (notif: Notification) => {
    // Mark as read
    if (!notif.isRead) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [notif.id] }),
        });
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notif.id ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silent
      }
    }
    // Navigate
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-1rem)] max-w-sm md:w-96 max-h-[70vh] overflow-y-auto rounded-lg border bg-card shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-[#00968a] hover:underline"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notif) => {
                const Icon = typeIcons[notif.type] ?? Info;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
                      !notif.isRead && "bg-[#00968a]/5"
                    )}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        !notif.isRead
                          ? "bg-[#00968a]/10 text-[#00968a]"
                          : "bg-gray-100 text-gray-400"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            !notif.isRead ? "font-semibold" : "font-medium text-gray-600"
                          )}
                        >
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-[#00968a]" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {notif.message}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
