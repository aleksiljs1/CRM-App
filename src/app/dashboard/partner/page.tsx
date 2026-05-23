import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Building2,
  Users,
  Award,
  Briefcase,
  Sparkles,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  Gauge,
  CheckCircle2,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  EmailsAreaChart,
  TasksAreaChart,
} from "@/components/dashboard/activity-charts";

// ── Inline section primitives (mirrored from HR dashboard) ─────────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

function InsightCard({
  accent,
  value,
  label,
  subtitle,
}: {
  accent: string;
  value: number;
  label: string;
  subtitle: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-card shadow-sm border-t-4 ${accent} p-6`}
    >
      <p className="text-[30px] font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function SmallStat({
  icon: Icon,
  iconBg,
  iconText,
  value,
  label,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <span
        className={`flex size-9 items-center justify-center rounded-lg ${iconBg} ${iconText}`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-base font-bold tabular-nums leading-tight text-foreground">
          {value}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300/60 hover:shadow-md"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function PartnerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  /* demo — no Prisma queries on this page; firm-wide numbers below are
     placeholders until real partner-scoped aggregates are wired in. */
  const totalDepartments = 8; /* demo */
  const totalClients = 0; /* demo */
  const openTasks = 0; /* demo */
  const totalEmployees = 0; /* demo */

  /* demo — recent activity placeholder; render empty state for now. */
  const recentActivity: { id: string; title: string; subtitle: string }[] = [];

  return (
    <div className="space-y-8">
      {/* Page title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            Firm Overview
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Partner dashboard &middot; firm-wide performance &middot; {today}
          </p>
        </div>
        <Link href="/dashboard/reports">
          <Button className="gap-2">
            <BarChart3 className="size-4" />
            View Reports
          </Button>
        </Link>
      </div>

      {/* ── Section 1 — Overview ─────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InsightCard
            accent="border-t-brand-500"
            value={totalDepartments}
            label="Total Departments"
            subtitle="Active practice areas"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={totalClients}
            label="Total Clients"
            subtitle="Firm-wide accounts on record"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={openTasks}
            label="Open Tasks"
            subtitle="In progress across the firm"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={totalEmployees}
            label="Total Employees"
            subtitle="Active staff firm-wide"
          />
        </div>
      </section>

      {/* ── Section 2 — Platform overview strip ─────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Platform</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SmallStat
            icon={Activity}
            iconBg="bg-cyan-100 dark:bg-cyan-900/40"
            iconText="text-cyan-700 dark:text-cyan-300"
            value="94%" /* demo */
            label="Reply rate today"
          />
          <SmallStat
            icon={Clock}
            iconBg="bg-amber-100 dark:bg-amber-900/40"
            iconText="text-amber-700 dark:text-amber-300"
            value="1h 12m" /* demo */
            label="Avg response"
          />
          <SmallStat
            icon={CheckCircle2}
            iconBg="bg-emerald-100 dark:bg-emerald-900/40"
            iconText="text-emerald-700 dark:text-emerald-300"
            value="On track" /* demo */
            label="SLA today"
          />
          <SmallStat
            icon={Gauge}
            iconBg="bg-violet-100 dark:bg-violet-900/40"
            iconText="text-violet-700 dark:text-violet-300"
            value="92%" /* demo */
            label="Workload utilization"
          />
        </div>
      </section>

      {/* ── Section 3 — Trends — two charts side by side ────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Emails received
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ↑ 12%
              </span>
            </div>
            <div className="mt-4 -ml-2">
              <EmailsAreaChart />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Tasks completed
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                ↑ 8%
              </span>
            </div>
            <div className="mt-4 -ml-2">
              <TasksAreaChart />
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4 — Quick actions ────────────────────────────────── */}
      <section>
        <SectionLabel icon={Zap}>Quick actions</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <QuickAction
            href="/dashboard/reports"
            icon={BarChart3}
            title="Reports"
            subtitle="Analytics and exports"
          />
          <QuickAction
            href="/dashboard/clients"
            icon={Building2}
            title="All Clients"
            subtitle="Firm-wide client roster"
          />
          <QuickAction
            href="/dashboard/manager/performance"
            icon={Award}
            title="Firm Performance"
            subtitle="Scores, rankings and trends"
          />
          <QuickAction
            href="/dashboard/manager/team"
            icon={Users}
            title="Team"
            subtitle="Members across all departments"
          />
        </div>
      </section>

      {/* ── Section 5 — Recent activity ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={Clock}>Recent activity</SectionLabel>
          <Link
            href="/dashboard/reports"
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {recentActivity.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Briefcase className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                Nothing to review yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Firm-wide updates and approvals will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {recentActivity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="size-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
