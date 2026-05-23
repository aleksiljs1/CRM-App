"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Mail,
  CheckSquare,
  CalendarDays,
  FileText,
  MessageSquare,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  Award,
  Menu,
  X,
  ScrollText,
  Cog,
  ShieldCheck,
  Building2,
  ClipboardList,
  Gauge,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { TeamChatSection } from "@/components/client/team-chat";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Emails",
    href: "/dashboard/workspace/emails",
    icon: Mail,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Tasks",
    href: "/dashboard/workspace/tasks",
    icon: CheckSquare,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Calendar",
    href: "/dashboard/workspace/calendar",
    icon: CalendarDays,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Documents",
    href: "/dashboard/workspace/documents",
    icon: FileText,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Chats",
    href: "/dashboard/workspace/chats",
    icon: MessageSquare,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "My Performance",
    href: "/dashboard/workspace/performance",
    icon: Award,
    roles: ["SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN", "MANAGER"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["PARTNER", "MANAGER", "SENIOR", "ASSOCIATE"],
  },
  {
    label: "Client Pipeline",
    href: "/dashboard/manager/clients",
    icon: Users,
    roles: ["PARTNER", "MANAGER"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["PARTNER", "MANAGER"],
  },
  {
    label: "Performance",
    href: "/dashboard/manager/performance",
    icon: TrendingUp,
    roles: ["PARTNER", "MANAGER"],
  },
  {
    label: "My Team",
    href: "/dashboard/manager/team",
    icon: Users,
    roles: ["PARTNER", "MANAGER"],
  },
  {
    label: "Dept Settings",
    href: "/dashboard/manager/settings",
    icon: Settings,
    roles: ["PARTNER", "MANAGER"],
  },
  {
    label: "Processes",
    href: "/dashboard/hr/processes",
    icon: FolderOpen,
    roles: ["MANAGER"],
  },
  {
    label: "Emails",
    href: "/dashboard/workspace/emails",
    icon: Mail,
    roles: ["ADMIN"],
  },
  {
    label: "Documents",
    href: "/dashboard/workspace/documents",
    icon: FileText,
    roles: ["ADMIN"],
  },
  {
    label: "Chats",
    href: "/dashboard/workspace/chats",
    icon: MessageSquare,
    roles: ["ADMIN"],
  },
  {
    label: "Users",
    href: "/dashboard/admin/users",
    icon: ShieldCheck,
    roles: ["ADMIN"],
  },
  {
    label: "Clients (Admin)",
    href: "/dashboard/admin/clients",
    icon: Building2,
    roles: ["ADMIN"],
  },
  {
    label: "Audit Log",
    href: "/dashboard/admin/audit-log",
    icon: ScrollText,
    roles: ["ADMIN"],
  },
  {
    label: "Processes",
    href: "/dashboard/admin/processes",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    label: "Tasks (All Depts)",
    href: "/dashboard/admin/tasks",
    icon: CheckSquare,
    roles: ["ADMIN"],
  },
  {
    label: "Firm Performance",
    href: "/dashboard/admin/performance",
    icon: Gauge,
    roles: ["ADMIN"],
  },
  {
    label: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Cog,
    roles: ["ADMIN"],
  },
];

// Pale per-role wash applied to the whole sidebar so each role has a visible
// identity in both light and dark modes.
const SIDEBAR_BG_BY_ROLE: Record<string, string> = {
  ADMIN:     "bg-slate-50 dark:bg-slate-950",
  PARTNER:   "bg-indigo-50 dark:bg-indigo-950",
  MANAGER:   "bg-blue-50 dark:bg-blue-950",
  SENIOR:    "bg-emerald-50 dark:bg-emerald-950",
  ASSOCIATE: "bg-cyan-50 dark:bg-cyan-950",
  JUNIOR:    "bg-amber-50 dark:bg-amber-950",
  ASSISTANT: "bg-orange-50 dark:bg-orange-950",
  INTERN:    "bg-pink-50 dark:bg-pink-950",
  CLIENT:    "bg-brand-50 dark:bg-brand-950",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  // Local override so the avatar can update instantly after upload without
  // waiting for the next session refresh. Listens for the custom event the
  // profile page dispatches.
  const [avatarOverride, setAvatarOverride] = useState<string | null | undefined>(
    undefined
  );
  useEffect(() => {
    function onAvatarUpdated(e: Event) {
      const detail = (e as CustomEvent<{ avatar: string | null }>).detail;
      setAvatarOverride(detail?.avatar ?? null);
    }
    window.addEventListener("profile:avatar-updated", onAvatarUpdated);
    return () =>
      window.removeEventListener("profile:avatar-updated", onAvatarUpdated);
  }, []);

  const avatar =
    avatarOverride !== undefined ? avatarOverride : session?.user?.avatar ?? null;

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  const sidebarBg = SIDEBAR_BG_BY_ROLE[userRole || ""] ?? "bg-card";

  // CLIENT-only: tracks whether the "Talk to your team" panel is expanded.
  // When expanded the sidebar widens from w-64 to w-80 to fit names + context.
  const [chatExpanded, setChatExpanded] = useState(false);

  // Mobile drawer state — opened via window event dispatched by the header
  // hamburger button. Desktop (md+) layout is unaffected because the aside
  // is always visible at md+ via `md:static md:flex md:translate-x-0`.
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    function onOpen() {
      setMobileOpen(true);
    }
    window.addEventListener("sidebar:open", onOpen);
    return () => window.removeEventListener("sidebar:open", onOpen);
  }, []);
  // Close the drawer on route change so the next page doesn't appear covered.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  // Lock body scroll while the drawer is open on mobile.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (mobileOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile backdrop — only present below md when drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex h-full flex-col border-r border-border transition-[width] duration-200 ease-out",
          // CLIENT role widens only when the team chat panel is expanded.
          userRole === "CLIENT" && chatExpanded ? "w-80" : "w-64",
          // Mobile: fixed overlay drawer, slides in from the left.
          // Desktop (md+): restore the original static, always-visible layout.
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:static md:translate-x-0 md:transition-none",
          sidebarBg
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600">
            <span className="text-sm font-bold text-white">K</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Kreston CRM</span>
          {/* Mobile-only close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-100/70 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  isActive
                    ? "text-brand-600 dark:text-brand-400"
                    : "text-muted-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}

        {/* CLIENT-only: persistent "Talk to your team" panel. Collapsed by
            default — clicking the header expands the contact list AND widens
            the sidebar to w-80 so names + context fit. */}
        {userRole === "CLIENT" && (
          <div className="pt-1">
            <TeamChatSection
              expanded={chatExpanded}
              onToggle={() => setChatExpanded((v) => !v)}
            />
          </div>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/profile"
            className="flex flex-1 min-w-0 items-center gap-3 rounded-md -m-1 p-1 hover:bg-muted transition-colors"
            title="View profile"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50 overflow-hidden">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={session?.user?.name ?? "User avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {session?.user?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session?.user?.subRole || session?.user?.role || ""}
              </p>
            </div>
          </Link>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
      </aside>
    </>
  );
}

// Mobile hamburger button — placed in the dashboard header to open the
// sidebar drawer. Hidden at md+ where the sidebar is always visible.
export function MobileMenuButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("sidebar:open"))}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
