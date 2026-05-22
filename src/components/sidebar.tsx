"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Mail,
  CheckSquare,
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
// identity. Falls back to bg-white when there's no session/role.
const SIDEBAR_BG_BY_ROLE: Record<string, string> = {
  ADMIN:     "bg-slate-50",
  PARTNER:   "bg-indigo-50",
  MANAGER:   "bg-blue-50",
  SENIOR:    "bg-emerald-50",
  ASSOCIATE: "bg-cyan-50",
  JUNIOR:    "bg-amber-50",
  ASSISTANT: "bg-orange-50",
  INTERN:    "bg-pink-50",
  CLIENT:    "bg-brand-50",
};

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const filteredItems = navItems.filter(
    (item) => !item.roles || (userRole && item.roles.includes(userRole))
  );

  const sidebarBg = SIDEBAR_BG_BY_ROLE[userRole || ""] ?? "bg-white";

  return (
    <aside
      className={cn("flex h-full w-64 flex-col border-r", sidebarBg)}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#00968a]">
          <span className="text-sm font-bold text-white">K</span>
        </div>
        <span className="text-lg font-semibold">Kreston CRM</span>
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
                  ? "bg-[#00968a]/10 text-[#00968a]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-[#00968a]" : "text-gray-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00968a]/10">
            <span className="text-xs font-medium text-[#00968a]">
              {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">
              {session?.user?.name ?? "User"}
            </p>
            <p className="truncate text-xs text-gray-500">
              {session?.user?.role ?? ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
