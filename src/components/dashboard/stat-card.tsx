import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  trend: string;
  trendPositive?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  trend,
  trendPositive = false,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group block cursor-pointer rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-brand-300/60"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="size-5" />
        </span>
        <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-2 text-xs ${
          trendPositive
            ? "text-emerald-600 dark:text-emerald-500"
            : "text-muted-foreground"
        }`}
      >
        {trend}
      </p>
    </Link>
  );
}
