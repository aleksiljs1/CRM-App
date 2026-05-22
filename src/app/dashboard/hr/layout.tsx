"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

function getDeptName(dept: string | null): string {
  const map: Record<string, string> = {
    AUDIT: "Audit & Advisory",
    ACCOUNTING_TAX: "Accounting & Tax",
    BOOKKEEPING_PAYROLL: "Bookkeeping & Payroll",
    LEGAL: "Legal Advisory",
    ADVISORY: "Advisory Services",
    HR: "HR & Payroll",
    MARKETING: "Marketing",
    FINANCE: "Finance",
  };
  return dept ? map[dept] || dept : "Firm-Wide";
}

const tabs = [
  { label: "Overview", href: "/dashboard/hr" },
  { label: "Emails", href: "/dashboard/hr/emails" },
  { label: "Tasks", href: "/dashboard/hr/tasks" },
  { label: "Documents", href: "/dashboard/hr/documents" },
];

export default function HRLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptDisplayName = getDeptName(dept);

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
                  ? "border-[#00968a] text-[#00968a]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
        <div className="ml-auto pr-2 py-1.5">
          <Badge variant="outline" className="text-xs bg-[#00968a]/10 text-[#00968a] border-[#00968a]/30">
            {deptDisplayName}
          </Badge>
        </div>
      </nav>
      {children}
    </div>
  );
}
