"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/dashboard/hr" },
  { label: "Emails", href: "/dashboard/hr/emails" },
  { label: "Tasks", href: "/dashboard/hr/tasks" },
  { label: "Calendar", href: "/dashboard/hr/calendar" },
  { label: "Documents", href: "/dashboard/hr/documents" },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="flex items-center gap-1 border-b mb-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard/hr"
              ? pathname === "/dashboard/hr"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
