import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Clock,
  Upload,
  Inbox,
  FolderOpen,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import {
  LiveTaskProgress,
  type LiveTask,
} from "@/components/client/live-task-progress";

// ── Helpers ────────────────────────────────────────────────────────────────

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

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  COMPLETE: "Complete",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

// ── Inline section primitives ──────────────────────────────────────────────

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
      className={`rounded-xl border bg-card shadow-sm border-t-4 ${accent} p-4 md:p-6`}
    >
      <p className="text-[30px] font-bold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-3 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function ClientDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const client = await prisma.client.findFirst({
    where: { contactEmail: session.user.email },
    include: {
      assignedTo: {
        select: { id: true, name: true, role: true },
      },
      submissions: {
        include: {
          processType: {
            include: {
              requiredDocuments: true,
            },
          },
          documents: true,
        },
        orderBy: { submittedAt: "desc" },
      },
      tasks: {
        include: {
          assignedTo: {
            select: { id: true, name: true, role: true },
          },
        },
      },
    },
  });

  const submissions = client?.submissions ?? [];
  const allTasks = client?.tasks ?? [];

  // Derived metrics — all from real data, no demo numbers
  const activeSubmissions = submissions.filter(
    (s) => s.status === "INCOMPLETE" || s.status === "UNDER_REVIEW"
  ).length;
  const totalDocuments = submissions.reduce(
    (sum, s) => sum + s.documents.length,
    0
  );
  const openTasks = allTasks.filter((t) => t.status !== "COMPLETED").length;
  const approvedCount = submissions.filter(
    (s) => s.status === "APPROVED"
  ).length;

  // Serialize tasks for the client component (Dates -> ISO strings)
  const liveTasks: LiveTask[] = allTasks.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    deadline: t.deadline ? t.deadline.toISOString() : null,
    assignedTo: t.assignedTo
      ? {
          id: t.assignedTo.id,
          name: t.assignedTo.name,
          role: t.assignedTo.role,
        }
      : null,
  }));

const displayName =
    client?.companyName ?? session.user.name ?? session.user.email;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page header */}
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-brand-700">
          Welcome, {displayName}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Your client portal &middot; {today}
        </p>
      </header>

      {/* Overall progress headline + Your active work — both live-updating */}
      <LiveTaskProgress initialTasks={liveTasks} />

{/* Overview — 4 real metrics */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <InsightCard
            accent="border-t-brand-500"
            value={activeSubmissions}
            label="Active Submissions"
            subtitle="Processes currently in progress"
          />
          <InsightCard
            accent="border-t-amber-500"
            value={openTasks}
            label="Open Work"
            subtitle="Tasks the firm is working on for you"
          />
          <InsightCard
            accent="border-t-emerald-500"
            value={totalDocuments}
            label="Documents Uploaded"
            subtitle="Across all your submissions"
          />
          <InsightCard
            accent="border-t-violet-500"
            value={approvedCount}
            label="Approved Items"
            subtitle="Successfully completed by our team"
          />
        </div>
      </section>

{/* Recent submissions */}
      <section>
        <SectionLabel icon={Clock}>Recent submissions</SectionLabel>
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
                Contact your account manager to get started.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {submissions.slice(0, 5).map((sub) => {
                const isAction = sub.status === "INCOMPLETE";
                const isApproved = sub.status === "APPROVED";
                const uploaded = sub.documents.length;
                const required = sub.processType.requiredDocuments.length;
                const hasRequiredList = required > 0;
                const submissionPct = hasRequiredList
                  ? Math.min(100, Math.round((uploaded / required) * 100))
                  : 0;
                return (
                  <li
                    key={sub.id}
                    className="flex items-center gap-3 md:gap-4 px-3 md:px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <FolderOpen className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {sub.processType.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {uploaded}{" "}
                        {uploaded === 1 ? "document" : "documents"}
                        {" · "}
                        {SUBMISSION_STATUS_LABELS[sub.status] ?? sub.status}
                      </p>
                      {hasRequiredList && (
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                            aria-valuenow={submissionPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${sub.processType.name}: ${uploaded} of ${required} documents`}
                          >
                            <div
                              className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out dark:bg-brand-400"
                              style={{ width: `${submissionPct}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {uploaded} of {required} documents
                          </span>
                        </div>
                      )}
                    </div>
                    {isAction && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        Action needed
                      </span>
                    )}
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {timeAgo(sub.submittedAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Footer hint — primary upload action when there are open requests */}
      {activeSubmissions > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <Upload className="size-4" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                You have {activeSubmissions} active submission
                {activeSubmissions === 1 ? "" : "s"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                If your team has asked for documents, you can upload them here.
              </p>
            </div>
            <Link href="/dashboard/client">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload className="size-3.5" />
                Upload
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
