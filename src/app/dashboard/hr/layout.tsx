"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Overview", href: "/dashboard/hr" },
  { label: "Emails", href: "/dashboard/hr/emails" },
  { label: "Tasks", href: "/dashboard/hr/tasks" },
  { label: "Documents", href: "/dashboard/hr/documents" },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="flex gap-1 border-b mb-6">
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
                  ? "border-[#00968a] text-[#00968a]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
