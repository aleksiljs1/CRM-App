"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Award,
  AlertTriangle,
  Activity,
  Loader2,
  Clock,
  CheckCircle,
  Users,
} from "lucide-react";

interface DepartmentStat {
  department: string;
  label: string;
  employeeCount: number;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  avgTasksPerEmployee: number;
  overdueTasks: number;
}

interface TopPerformer {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
  };
  performanceScore: number;
  tasksCompleted: number;
  totalTasks: number;
  completionRate: number;
  onTimeRate: number;
}

interface DeptHealth {
  department: string;
  label: string;
  employeeCount: number;
  avgTasksPerEmployee: number;
  status: "Underloaded" | "Balanced" | "Overloaded";
}

interface OverdueTask {
  id: string;
  title: string;
  department: string | null;
  departmentLabel: string;
  assignedTo: string;
  deadline: string;
  daysOverdue: number;
}

interface PerformanceResponse {
  departmentStats: DepartmentStat[];
  topPerformers: TopPerformer[];
  departmentHealth: DeptHealth[];
  overdueTasks: OverdueTask[];
}

function rateColor(rate: number) {
  if (rate >= 80)
    return "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40";
  if (rate >= 50)
    return "text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40";
  return "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40";
}

function healthColor(status: string) {
  if (status === "Balanced")
    return {
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: <CheckCircle className="h-4 w-4" />,
    };
  if (status === "Overloaded")
    return {
      bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
      icon: <AlertTriangle className="h-4 w-4" />,
    };
  return {
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
    text: "text-amber-700 dark:text-amber-300",
    icon: <Clock className="h-4 w-4" />,
  };
}

export default function AdminPerformancePage() {
  const [data, setData] = useState<PerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/performance");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch {
        setError("Failed to load performance data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-muted-foreground">
            Computing firm-wide metrics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-300">
          Firm-Wide Performance Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Department comparison, top performers, workload health, and overdue
          alerts
        </p>
      </div>

      {/* ── Section 1: Department Comparison ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <BarChart3 className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Department Comparison
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Employees
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Open
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Completed
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Completion %
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Avg/Employee
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.departmentStats.map((d) => (
                  <tr
                    key={d.department}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {d.label}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {d.employeeCount}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {d.openTasks}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {d.completedTasks}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${rateColor(d.completionRate)}`}
                      >
                        {d.completionRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {d.avgTasksPerEmployee}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.overdueTasks > 0 ? (
                        <span className="inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                          {d.overdueTasks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
                {data.departmentStats.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No department data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 2: Top 10 Performers ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Award className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Top 10 Performers (Firm-Wide)
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Rank
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Score
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Completion %
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    On-Time %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topPerformers.map((p, idx) => (
                  <tr
                    key={p.user.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {p.user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.user.department || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {p.user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${rateColor(p.performanceScore)}`}
                      >
                        {p.performanceScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {p.completionRate}%
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {p.onTimeRate}%
                    </td>
                  </tr>
                ))}
                {data.topPerformers.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No performance data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Section 3: Department Health ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <Activity className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Department Health
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.departmentHealth.map((h) => {
            const c = healthColor(h.status);
            return (
              <div
                key={h.department}
                className={`rounded-xl border p-5 shadow-sm ${c.bg}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {h.label}
                  </h3>
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${c.text}`}
                  >
                    {c.icon}
                    {h.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {h.avgTasksPerEmployee}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      tasks/person
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {h.employeeCount}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      employees
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          {data.departmentHealth.length === 0 && (
            <div className="col-span-full flex items-center justify-center rounded-xl border bg-card py-12 shadow-sm">
              <p className="text-sm text-muted-foreground">
                No department health data
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Overdue Tasks Alert ── */}
      <section>
        <div className="flex items-center gap-1.5 mb-3">
          <AlertTriangle className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Overdue Tasks Alert
          </span>
          {data.overdueTasks.length > 0 && (
            <span className="ml-1 rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-300">
              {data.overdueTasks.length}
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Task
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Days Overdue
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.overdueTasks.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium text-foreground max-w-[250px] truncate">
                      {t.title}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.departmentLabel}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {t.assignedTo}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(t.deadline).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">
                        {t.daysOverdue}d
                      </span>
                    </td>
                  </tr>
                ))}
                {data.overdueTasks.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                        <p>No overdue tasks - all on track!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
