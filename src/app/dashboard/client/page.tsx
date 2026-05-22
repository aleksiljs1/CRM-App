import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Mail,
  MessageSquare,
  FileText,
  Upload,
  Sparkles,
  Activity,
  Zap,
  Clock,
  ArrowRight,
  LineChart,
  CheckCircle2,
  ClipboardList,
  Inbox,
  UserCircle,
  CalendarClock,
  Gauge,
  FolderOpen,
  type LucideIcon,
} from "lucide-react";
import {
  EmailsAreaChart,
  TasksAreaChart,
} from "@/components/dashboard/activity-charts";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const statusLabels: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  COMPLETE: "Complete",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ── Inline section primitives ───────────────────────────────────────────────

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
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
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

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const client = await prisma.client.findFirst({
    where: { contactEmail: session.user.email },
  });

  const submissions = client
    ? await prisma.clientSubmission.findMany({
        where: { clientId: client.id },
        include: {
          processType: true,
          documents: true,
        },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  // Derived metrics from the data we already fetched (no new queries).
  const activeSubmissions = submissions.filter(
    (s) => s.status === "INCOMPLETE" || s.status === "UNDER_REVIEW"
  ).length;
  const totalDocuments = submissions.reduce(
    (sum, s) => sum + s.documents.length,
    0
  );
  const openRequests = submissions.filter(
    (s) => s.status === "INCOMPLETE"
  ).length;
  const approvedCount = submissions.filter(
    (s) => s.status === "APPROVED"
  ).length;

  const displayName =
    client?.companyName ?? session.user.name ?? session.user.email;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Page title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            Welcome, {displayName}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your client portal &middot; {today}
          </p>
        </div>
        <Link href="/dashboard/client">
          <Button className="gap-2">
            <Upload className="size-4" />
            Upload Documents
          </Button>
        </Link>
      </div>

      {/* ── Section 1 — Insights ──────────────────────────────────────── */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <InsightCard
            accent="border-t-brand-500"
            value={activeSubmissions}
            label="Active Submissions"
            subtitle="Processes currently in progress"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={totalDocuments}
            label="Documents Uploaded"
            subtitle="Across all your submissions"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={openRequests}
            label="Open Requests"
            subtitle="Items still needing your input"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={approvedCount}
            label="Approved Items"
            subtitle="Successfully completed by our team"
          />
        </div>
      </section>

      {/* ── Section 2 — Platform overview strip ──────────────────────── */}
      <section>
        <SectionLabel icon={Activity}>Platform</SectionLabel>
        <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SmallStat
            icon={Clock}
            iconBg="bg-cyan-100"
            iconText="text-cyan-700"
            value="2h 30m" /* demo */
            label="Avg response from your team"
          />
          <SmallStat
            icon={CalendarClock}
            iconBg="bg-amber-100"
            iconText="text-amber-700"
            value="Jun 15" /* demo */
            label="Next deadline"
          />
          <SmallStat
            icon={CheckCircle2}
            iconBg="bg-emerald-100"
            iconText="text-emerald-700"
            value="100%" /* demo */
            label="Submissions on track"
          />
          <SmallStat
            icon={Gauge}
            iconBg="bg-violet-100"
            iconText="text-violet-700"
            value="Active" /* demo */
            label="Account status"
          />
        </div>
      </section>

      {/* ── Trends — two charts side by side ────────────────────────── */}
      <section>
        <SectionLabel icon={LineChart}>Trends</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Messages received
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                &uarr; 12%
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
                  Submissions activity
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Last 14 days
                </p>
              </div>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                &uarr; 8%
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
            href="/dashboard/client"
            icon={MessageSquare}
            title="View Messages"
            subtitle="Communication from your team"
          />
          <QuickAction
            href="/dashboard/client"
            icon={Upload}
            title="Upload Documents"
            subtitle="Send files securely"
          />
          <QuickAction
            href="/dashboard/client"
            icon={ClipboardList}
            title="View Submissions"
            subtitle="Track your active processes"
          />
          <QuickAction
            href="/dashboard/client"
            icon={UserCircle}
            title="Contact Manager"
            subtitle="Reach your account representative"
          />
        </div>
      </section>

      {/* ── Section 5 — Recent activity ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between">
          <SectionLabel icon={Clock}>Recent activity</SectionLabel>
          <Link
            href="/dashboard/client"
            className="text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
          >
            View all &rarr;
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <Inbox className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No active processes
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Contact your representative to get started.
              </p>
            </div>
          ) : (
            <ul>
              {submissions.slice(0, 5).map((sub, idx) => {
                const isUrgent = sub.status === "INCOMPLETE";
                return (
                  <li key={sub.id}>
                    <Link
                      href="/dashboard/client"
                      className={`flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/40 ${
                        idx > 0 ? "border-t" : ""
                      }`}
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <FolderOpen className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {sub.processType.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {sub.documents.length}{" "}
                          {sub.documents.length === 1
                            ? "document"
                            : "documents"}{" "}
                          &middot;{" "}
                          {statusLabels[sub.status] ?? sub.status}
                        </p>
                      </div>
                      {isUrgent && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                          Action needed
                        </span>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {timeAgo(sub.submittedAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
