"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
  LayoutGrid,
  ExternalLink,
} from "lucide-react";

// ─── Types (kept in sync with /api/tasks shape) ─────────────────────────────

interface TaskUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TaskClient {
  id: string;
  companyName: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: string | null;
  department: string | null;
  assignedToId: string | null;
  createdById: string;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignedTo: TaskUser | null;
  createdBy: TaskUser;
  client: TaskClient | null;
}

// ─── Priority + status palettes (mirrored from the kanban page) ─────────────

const PRIORITY_CHIP: Record<
  string,
  { label: string; chip: string; dot: string }
> = {
  URGENT: {
    label: "Urgent",
    chip:
      "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    dot: "bg-red-500",
  },
  HIGH: {
    label: "High",
    chip:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  MEDIUM: {
    label: "Medium",
    chip:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  LOW: {
    label: "Low",
    chip:
      "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  TODO: {
    label: "To Do",
    className:
      "bg-muted text-foreground/80 dark:bg-muted dark:text-foreground/80",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  REVIEW: {
    label: "Review",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  APPROVED: {
    label: "Approved",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
};

// ─── Date helpers (local time) ──────────────────────────────────────────────

/** Local-time YYYY-MM-DD key — same convention as the dashboard page. */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Build a 6×7 grid of dates covering the month, padded with leading/trailing days. */
function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const startWeekday = first.getDay(); // 0 = Sun
  const grid: Date[] = [];
  const gridStart = new Date(
    first.getFullYear(),
    first.getMonth(),
    1 - startWeekday
  );
  for (let i = 0; i < 42; i++) {
    const d = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );
    grid.push(d);
  }
  return grid;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatFullDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Page ───────────────────────────────────────────────────────────────────

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

export default function HRCalendarPage() {
  const { data: session } = useSession();
  const role = session?.user?.role || "";
  const dept = session?.user?.department || null;
  const isManagerPlus = ["ADMIN", "PARTNER", "MANAGER"].includes(role);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarView, setCalendarView] = useState<"personal" | "team">("personal");
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Fetch all tasks assigned to the current user (api scopes by session).
  // We fetch once and filter client-side — keeps things simple, and the api
  // does not currently support a date range query param.
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/tasks", {
        params: { mine: calendarView === "personal" ? "true" : "false" },
      });
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [calendarView]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Bucket tasks by local YYYY-MM-DD deadline key.
  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.deadline) continue;
      const k = dayKey(new Date(task.deadline));
      const arr = map.get(k);
      if (arr) arr.push(task);
      else map.set(k, [task]);
    }
    // Sort each day's tasks by priority then title for stable display.
    const priorityRank: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const pa = priorityRank[a.priority] ?? 2;
        const pb = priorityRank[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        return a.title.localeCompare(b.title);
      });
    }
    return map;
  }, [tasks]);

  const monthGrid = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  // Tasks within the visible month (for the "no tasks this month" empty state).
  const tasksThisMonth = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const d = new Date(t.deadline);
      return (
        d.getFullYear() === viewMonth.getFullYear() &&
        d.getMonth() === viewMonth.getMonth()
      );
    });
  }, [tasks, viewMonth]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    return tasksByDay.get(dayKey(selectedDay)) ?? [];
  }, [selectedDay, tasksByDay]);

  function goPrevMonth() {
    setViewMonth((m) => addMonths(m, -1));
  }
  function goNextMonth() {
    setViewMonth((m) => addMonths(m, 1));
  }
  function goToday() {
    const now = new Date();
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now);
  }

  return (
    <div className="space-y-6">
      {/* Page title row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700">
            {calendarView === "personal" ? "My Calendar" : `${getDeptName(dept)} Team Calendar`}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {calendarView === "personal" ? "Your tasks" : "All department tasks"} plotted by deadline &middot; {formatMonthYear(viewMonth)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {isManagerPlus && (
            <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
              <button
                onClick={() => setCalendarView("personal")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  calendarView === "personal"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setCalendarView("team")}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-all sm:flex-none ${
                  calendarView === "team"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Team
              </button>
            </div>
          )}
          <Link href="/dashboard/hr/tasks" className="w-full sm:w-auto">
            <Button className="gap-2 bg-brand-600 text-white hover:bg-brand-700 w-full sm:w-auto">
              <LayoutGrid className="size-4" />
              View Kanban
            </Button>
          </Link>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            aria-label="Previous month"
            className="flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-[10ch] text-base font-semibold tracking-tight text-foreground">
            {formatMonthYear(viewMonth)}
          </h2>
          <button
            type="button"
            onClick={goNextMonth}
            aria-label="Next month"
            className="flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToday}
            className="ml-1 gap-1.5"
          >
            <CalendarIcon className="size-3.5" />
            Today
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {(["URGENT", "HIGH", "MEDIUM", "LOW"] as const).map((p) => {
            const cfg = PRIORITY_CHIP[p];
            return (
              <div
                key={p}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
              >
                <span className={`size-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar grid card */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto md:overflow-x-visible">
        <div className="min-w-[640px] md:min-w-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Loading state covers the grid body */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-5 animate-spin text-brand-600 dark:text-brand-400" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading tasks...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {monthGrid.map((date, idx) => {
              const inMonth = date.getMonth() === viewMonth.getMonth();
              const isToday = isSameDay(date, today);
              const isSelected =
                selectedDay !== null && isSameDay(date, selectedDay);
              const dayTasks = tasksByDay.get(dayKey(date)) ?? [];
              const visibleTasks = dayTasks.slice(0, 3);
              const extraCount = dayTasks.length - visibleTasks.length;

              const cellBorder =
                idx % 7 === 0 ? "border-t" : "border-l border-t";
              const cellBg = inMonth ? "bg-card" : "bg-muted/30";
              const ringClass = isSelected
                ? "ring-2 ring-brand-500 ring-inset"
                : "";

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedDay(date)}
                  className={`relative flex min-h-[110px] flex-col gap-1 p-2 text-left transition-colors hover:bg-muted/40 focus:outline-none ${cellBorder} ${cellBg} ${ringClass}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    {isToday ? (
                      <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-[12px] font-semibold text-white">
                        {date.getDate()}
                      </span>
                    ) : (
                      <span
                        className={`text-[12px] font-semibold ${
                          inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    )}
                    {dayTasks.length > 0 && (
                      <span className="rounded-full bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Task chips */}
                  <div className="flex flex-col gap-1">
                    {visibleTasks.map((task) => {
                      const cfg =
                        PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.MEDIUM;
                      const overdue =
                        new Date(task.deadline as string) < today &&
                        task.status !== "COMPLETED";
                      return (
                        <span
                          key={task.id}
                          title={`${cfg.label} · ${task.title}${calendarView === "team" && task.assignedTo ? ` (${task.assignedTo.name})` : ""}`}
                          className={`flex h-5 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium truncate ${cfg.chip} ${
                            overdue
                              ? "ring-1 ring-red-500/70 dark:ring-red-400/70"
                              : ""
                          }`}
                        >
                          {overdue && (
                            <AlertCircle className="size-3 shrink-0 text-red-600 dark:text-red-400" />
                          )}
                          <span className="truncate">{task.title}</span>
                        </span>
                      );
                    })}
                    {extraCount > 0 && (
                      <span
                        className="h-5 rounded-md bg-muted px-1.5 text-[11px] font-medium leading-5 text-muted-foreground"
                      >
                        +{extraCount} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Empty state — no tasks this month */}
      {!loading && tasksThisMonth.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">
          No tasks with deadlines in {formatMonthYear(viewMonth)}.
        </p>
      )}

      {/* Day detail panel */}
      {selectedDay && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {formatFullDate(selectedDay)}
              </h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedDayTasks.length === 0
                  ? "No tasks scheduled"
                  : `${selectedDayTasks.length} task${selectedDayTasks.length === 1 ? "" : "s"} scheduled`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Close
            </button>
          </div>

          {selectedDayTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              No tasks scheduled for{" "}
              {selectedDay.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
              })}
              .
            </p>
          ) : (
            <ul className="divide-y">
              {selectedDayTasks.map((task) => {
                const priority =
                  PRIORITY_CHIP[task.priority] ?? PRIORITY_CHIP.MEDIUM;
                const status =
                  STATUS_BADGE[task.status] ?? {
                    label: task.status,
                    className: "bg-muted text-muted-foreground",
                  };
                const overdue =
                  new Date(task.deadline as string) < today &&
                  task.status !== "COMPLETED";
                return (
                  <li key={task.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">
                          {task.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${priority.chip}`}
                          >
                            {priority.label}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[11px] ${status.className}`}
                          >
                            {status.label}
                          </Badge>
                          {overdue && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[11px] bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                            >
                              <AlertCircle className="size-3" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
                          <span>
                            <span className="text-muted-foreground/70">
                              Assignee:{" "}
                            </span>
                            <span className="text-foreground/80">
                              {task.assignedTo?.name ?? "Unassigned"}
                            </span>
                          </span>
                          {task.client && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Client:{" "}
                              </span>
                              <span className="text-foreground/80">
                                {task.client.companyName}
                              </span>
                            </span>
                          )}
                          {task.department && (
                            <span>
                              <span className="text-muted-foreground/70">
                                Department:{" "}
                              </span>
                              <span className="text-foreground/80">
                                {task.department.replace("_", " ")}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/dashboard/hr/tasks"
                        className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        View on board
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
