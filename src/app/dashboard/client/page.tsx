import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  Inbox,
  FolderOpen,
  CheckCircle2,
  FileText,
  type LucideIcon,
} from "lucide-react";
import {
  LiveTaskProgress,
  type LiveTask,
} from "@/components/client/live-task-progress";
import { ClientProcessesSection } from "@/components/client/client-processes";

// ── Helpers ────────────────────────────────────────────────────────────────

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
  const directTasks = client?.tasks ?? [];

  // Also fetch tasks linked to processes that this client has submissions for
  const clientProcessIds = submissions.map((s) => s.processTypeId);
  const processTasks = clientProcessIds.length > 0
    ? await prisma.task.findMany({
        where: {
          processTypeId: { in: clientProcessIds },
          clientId: null, // tasks not directly linked to client but linked via process
        },
        include: {
          assignedTo: { select: { id: true, name: true, role: true } },
          requiredDocument: { select: { id: true, documentName: true } },
        },
      })
    : [];

  // Merge direct tasks + process-linked tasks (deduplicate)
  const taskIds = new Set(directTasks.map((t: any) => t.id));
  const allTasks = [
    ...directTasks,
    ...processTasks.filter((t) => !taskIds.has(t.id)),
  ];

  // Fetch processes linked to client tasks (for the Processes section)
  const processesFromTasks = allTasks
    .filter((t: any) => t.processTypeId)
    .map((t: any) => t.processTypeId as string);
  const uniqueProcessIds = [...new Set([
    ...submissions.map((s) => s.processTypeId),
    ...processesFromTasks,
  ])];

  const clientProcesses = uniqueProcessIds.length > 0
    ? await prisma.processType.findMany({
        where: { id: { in: uniqueProcessIds } },
        include: {
          requiredDocuments: {
            where: { source: "CLIENT" },
          },
        },
      })
    : [];

  // Fetch tasks linked to processes for this client (shows what legal team is working on)
  // Includes tasks directly linked to client AND tasks linked via process submissions
  const teamProcessTasks = await prisma.task.findMany({
    where: {
      processTypeId: { in: clientProcessIds.length > 0 ? clientProcessIds : ["none"] },
    },
    select: {
      id: true,
      title: true,
      status: true,
      processTypeId: true,
      requiredDocumentId: true,
      requiredDocument: { select: { id: true, documentName: true } },
      assignedTo: { select: { name: true, subRole: true, role: true } },
    },
  });

  // Build process status data for the UI
  const processStatusData = clientProcesses.map((proc) => {
    const sub = submissions.find((s) => s.processTypeId === proc.id);
    const uploadedDocs = sub?.documents ?? [];
    const matchedIds = new Set(
      uploadedDocs
        .map((d) => d.aiMatchedToId)
        .filter((v): v is string => Boolean(v))
    );
    const requiredDocs = proc.requiredDocuments;
    const uploadedCount = matchedIds.size;
    const missingDocs = requiredDocs.filter((r) => !matchedIds.has(r.id));

    // Tasks linked to this process
    const linkedTasks = teamProcessTasks
      .filter((t) => t.processTypeId === proc.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        documentName: t.requiredDocument?.documentName || null,
        assignedTo: t.assignedTo
          ? t.assignedTo.subRole || t.assignedTo.role
          : "Unassigned",
      }));

    return {
      id: proc.id,
      name: proc.name,
      description: proc.description,
      totalRequired: requiredDocs.length,
      uploadedCount,
      missingDocs: missingDocs.map((d) => d.documentName),
      submissionId: sub?.id ?? null,
      status: sub?.status ?? null,
      requiredDocuments: requiredDocs.map((d) => ({
        id: d.id,
        documentName: d.documentName,
        description: d.description,
        isMandatory: d.isMandatory,
      })),
      teamTasks: linkedTasks,
    };
  });

  // Build action items from missing required docs across incomplete submissions
  const actionItems = processStatusData.flatMap((proc) =>
    proc.missingDocs.map((docName) => ({
      id: `${proc.id}-${docName}`,
      requiredDocName: docName,
      processTypeName: proc.name,
    }))
  );

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

      {/* Processes — document requirements and upload status */}
      {processStatusData.length > 0 && (
        <section>
          <SectionLabel icon={FileText}>Processes</SectionLabel>
          <div className="mt-3">
            <ClientProcessesSection processes={processStatusData} />
          </div>
        </section>
      )}

      {/* Overview — 4 real metrics */}
      <section>
        <SectionLabel icon={Sparkles}>Overview</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
