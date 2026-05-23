"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

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
    href: "/dashboard/hr/emails",
    icon: Mail,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Tasks",
    href: "/dashboard/hr/tasks",
    icon: CheckSquare,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Calendar",
    href: "/dashboard/hr/calendar",
    icon: CalendarDays,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Documents",
    href: "/dashboard/hr/documents",
    icon: FileText,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "Chats",
    href: "/dashboard/hr/chats",
    icon: MessageSquare,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN"],
  },
  {
    label: "My Performance",
    href: "/dashboard/hr/performance",
    icon: Award,
    roles: ["SENIOR", "ASSOCIATE", "JUNIOR", "ASSISTANT", "INTERN", "MANAGER"],
  },
  {
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    roles: ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE"],
  },
  {
    label: "Client Pipeline",
    href: "/dashboard/manager/clients",
    icon: Users,
    roles: ["ADMIN", "PARTNER", "MANAGER"],
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["ADMIN", "PARTNER", "MANAGER"],
  },
  {
    label: "Performance",
    href: "/dashboard/manager/performance",
    icon: TrendingUp,
    roles: ["ADMIN", "PARTNER", "MANAGER"],
  },
  {
    label: "My Team",
    href: "/dashboard/manager/team",
    icon: Users,
    roles: ["ADMIN", "PARTNER", "MANAGER"],
  },
  {
    label: "Dept Settings",
    href: "/dashboard/manager/settings",
    icon: Settings,
    roles: ["ADMIN", "PARTNER", "MANAGER"],
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

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  const sidebarBg = SIDEBAR_BG_BY_ROLE[userRole || ""] ?? "bg-card";

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-border",
        sidebarBg
      )}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600">
          <span className="text-sm font-bold text-white">K</span>
        </div>
        <span className="text-lg font-semibold text-foreground">Kreston CRM</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
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
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-900/50">
            <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {session?.user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session?.user?.role ?? ""}
            </p>
          </div>
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
  );
}
