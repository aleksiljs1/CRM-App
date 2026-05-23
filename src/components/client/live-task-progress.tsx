"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ClipboardList,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import {
  overallTasksPercent,
  taskPercent,
} from "@/lib/task-progress";

// ── Types ──────────────────────────────────────────────────────────────────

export interface LiveTask {
  id: string;
  title: string;
  status: string;
  /** ISO date string (server -> client serialization-friendly) or null */
  deadline: string | null;
  assignedTo: { id: string; name: string; role: string } | null;
}

interface TaskProgressEvent {
  taskId: string;
  status: string;
}

// ── Inline helpers (mirror the server component's look) ────────────────────

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

const STATUS_DISPLAY: Record<string, { label: string; chip: string }> = {
  TODO: {
    label: "To Do",
    chip: "bg-muted text-muted-foreground",
  },
  IN_PROGRESS: {
    label: "In Progress",
    chip: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  REVIEW: {
    label: "In Review",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  COMPLETED: {
    label: "Completed",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
};

function deadlineText(deadlineIso: string | null): {
  text: string;
  isOverdue: boolean;
} {
  if (!deadlineIso) return { text: "No deadline", isOverdue: false };
  const deadline = new Date(deadlineIso);
  const diffMs = deadline.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
  if (diffDays === 0) return { text: "Due today", isOverdue: false };
  if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
  if (diffDays <= 7) return { text: `Due in ${diffDays}d`, isOverdue: false };
  return {
    text: deadline.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    isOverdue: false,
  };
}

// ── Circular ring ──────────────────────────────────────────────────────────

function ProgressRing({
  percent,
  size = 112,
  stroke = 10,
}: {
  percent: number;
  size?: number;
  stroke?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Overall progress: ${clamped}% complete`}
      role="img"
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--border)"
          strokeOpacity={0.5}
          strokeWidth={stroke}
          fill="none"
        />
        {/* Fill — brand teal, swaps tones automatically in dark mode via the
            two tokens we layer in CSS variables */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--color-brand-600)"
          className="dark:[stroke:var(--color-brand-400)] transition-[stroke-dashoffset] duration-500 ease-out"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums leading-none text-foreground">
          {clamped}%
        </span>
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          complete
        </span>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function LiveTaskProgress({
  initialTasks,
}: {
  initialTasks: LiveTask[];
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [tasks, setTasks] = useState<LiveTask[]>(initialTasks);

  // Keep state in sync if the server-rendered prop changes (e.g. after
  // navigation / revalidation).
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Subscribe to task-progress events on the user's personal room.
  useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocket();

    // Join the personal user room (chat-popup also does this, idempotent on
    // the server side via socket.join).
    socket.emit("join", currentUserId);

    const handleConnect = () => {
      socket.emit("join", currentUserId);
    };

    const handleTaskProgress = (data: TaskProgressEvent) => {
      if (!data?.taskId || !data?.status) return;
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === data.taskId);
        if (idx === -1) return prev; // task isn't in our list — nothing to do
        const prevStatus = prev[idx].status;
        if (prevStatus === data.status) return prev;
        const next = prev.slice();
        next[idx] = { ...next[idx], status: data.status };
        // Show a subtle toast so the user notices the live update.
        const label =
          STATUS_DISPLAY[data.status]?.label ?? data.status;
        toast.success(`Task updated: ${next[idx].title} — ${label}`);
        return next;
      });
    };

    socket.on("connect", handleConnect);
    socket.on("task-progress", handleTaskProgress);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("task-progress", handleTaskProgress);
    };
  }, [currentUserId]);

  // Active (non-completed) tasks, sorted by deadline asc, capped at 6.
  const activeTaskList = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "COMPLETED")
      .sort((a, b) => {
        const da = a.deadline
          ? new Date(a.deadline).getTime()
          : Number.POSITIVE_INFINITY;
        const db = b.deadline
          ? new Date(b.deadline).getTime()
          : Number.POSITIVE_INFINITY;
        return da - db;
      })
      .slice(0, 6);
  }, [tasks]);

  // Overall % is the average across all non-completed tasks. If there are no
  // tasks at all, we show 0% with a friendly empty state.
  const { overallPercent, hasAnyTasks, activeCount } = useMemo(() => {
    const nonCompleted = tasks.filter((t) => t.status !== "COMPLETED");
    return {
      overallPercent: overallTasksPercent(nonCompleted.map((t) => t.status)),
      hasAnyTasks: tasks.length > 0,
      activeCount: nonCompleted.length,
    };
  }, [tasks]);

  return (
    <>
      {/* ── Overall progress headline ───────────────────────────────────── */}
      <section>
        <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
          {!hasAnyTasks ? (
            <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:gap-6 sm:text-left">
              <ProgressRing percent={0} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">
                  No active work tracked yet
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Once the firm picks up tasks for your account, your progress
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-7 sm:text-left">
              <ProgressRing percent={overallPercent} />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  Your work is {overallPercent}% complete
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
                  {" · "}
                  {activeCount} active
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Active work list ────────────────────────────────────────────── */}
      <section>
        <SectionLabel icon={ClipboardList}>Your active work</SectionLabel>

        <div className="mt-3 overflow-hidden rounded-xl border bg-card shadow-sm">
          {activeTaskList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
                <ListChecks className="size-6 text-muted-foreground" />
              </span>
              <p className="mt-3 text-sm font-medium text-foreground">
                No active work right now
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                When the firm picks up tasks for your account, they&apos;ll
                appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {activeTaskList.map((task) => {
                const dl = deadlineText(task.deadline);
                const status =
                  STATUS_DISPLAY[task.status] ?? STATUS_DISPLAY.TODO;
                const pct = taskPercent(task.status);
                return (
                  <li
                    key={task.id}
                    className="flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40"
                  >
                    <span
                      className={`mt-0.5 inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${status.chip}`}
                    >
                      {status.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {task.title}
                      </p>
                      {/* Per-task progress bar */}
                      <div
                        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${task.title}: ${pct}% complete`}
                      >
                        <div
                          className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out dark:bg-brand-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">
                        {task.assignedTo
                          ? `Assigned to ${task.assignedTo.name}`
                          : "Unassigned"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 text-xs font-medium ${
                          dl.isOverdue
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground/80"
                        }`}
                      >
                        {dl.isOverdue && <AlertTriangle className="size-3.5" />}
                        {dl.text}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        deadline
                      </p>
                      <p className="mt-1 text-xs font-semibold tabular-nums text-foreground">
                        {pct}%
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
