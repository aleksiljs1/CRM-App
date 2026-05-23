"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Loader2,
  ClipboardList,
  ExternalLink,
  Plus,
  X,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";

interface TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    subRole?: string | null;
    department: string | null;
    avatar: string | null;
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
    emailsHandled: number;
  };
}

interface UserTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  deadline: string | null;
  createdAt: string;
  completedAt: string | null;
  hoursToComplete: number | null;
}

interface UserTasksResponse {
  tasks: UserTask[];
  summary: { completed: number; active: number; overdue: number };
}

type Period = "day" | "week" | "month";

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
  return dept ? map[dept] || dept : "All Departments";
}

const roleBadgeColors: Record<string, string> = {
  MANAGER: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  SENIOR: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  ASSOCIATE: "bg-brand-100/70 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800",
  JUNIOR: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  ASSISTANT: "bg-muted text-muted-foreground border-border",
  INTERN: "bg-muted text-muted-foreground border-border",
  ADMIN: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  PARTNER: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
};

const roleAvatarColors: Record<string, string> = {
  MANAGER: "bg-purple-500",
  SENIOR: "bg-blue-500",
  ASSOCIATE: "bg-brand-600",
  JUNIOR: "bg-amber-500",
  ASSISTANT: "bg-muted-foreground/70",
  INTERN: "bg-muted-foreground/70",
  ADMIN: "bg-red-500",
  PARTNER: "bg-indigo-500",
};

const statusColors: Record<string, string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  REVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
};

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  LOW: "bg-muted text-muted-foreground",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Add Employee Modal ─────────────────────────────────────────────────────

function AddEmployeeModal({
  department,
  onClose,
  onCreated,
}: {
  department: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ASSOCIATE");
  const [subRole, setSubRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          subRole: subRole.trim() || null,
          department,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create employee");
        return;
      }
      onCreated();
      onClose();
    } catch {
      setFormError("Failed to create employee");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Add Employee</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@kreston.al"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Password *
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="SENIOR">Senior</option>
                <option value="ASSOCIATE">Associate</option>
                <option value="JUNIOR">Junior</option>
                <option value="ASSISTANT">Assistant</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Sub-role (optional)
              </label>
              <Input
                value={subRole}
                onChange={(e) => setSubRole(e.target.value)}
                placeholder="e.g. Senior Associate, Junior Auditor"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display title that replaces the role label
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Department
              </label>
              <Badge className="bg-brand-100/70 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-500/20 hover:bg-brand-100/70 dark:hover:bg-brand-900/40">
                {getDeptName(department)}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-set to your department
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !name.trim() || !email.trim() || !password.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <UserPlus className="w-4 h-4 mr-1" />
              )}
              Create Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Task History Panel ─────────────────────────────────────────────────────

function TaskHistoryPanel({ userId }: { userId: string }) {
  const [period, setPeriod] = useState<Period | null>(null);
  const [tasks, setTasks] = useState<UserTask[]>([]);
  const [summary, setSummary] = useState<{ completed: number; active: number; overdue: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const periodLabels: Record<Period, string> = {
    day: "Today",
    week: "Week",
    month: "Month",
  };

  async function fetchTasks(p: Period) {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${userId}/tasks?period=${p}`);
      if (!res.ok) throw new Error("Failed");
      const data: UserTasksResponse = await res.json();
      setTasks(data.tasks);
      setSummary(data.summary);
      setExpanded(true);
    } catch {
      setTasks([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function handlePeriodClick(p: Period) {
    if (period === p && expanded) {
      setExpanded(false);
      setPeriod(null);
      return;
    }
    setPeriod(p);
    fetchTasks(p);
  }

  return (
    <div className="border-t pt-3 mt-1">
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">View Tasks:</span>
        <div className="flex rounded-md border border-border bg-muted/50 p-0.5">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodClick(p)}
              className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${
                period === p && expanded
                  ? "bg-[#00968a] text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-[#00968a]" />}
      </div>

      {expanded && !loading && summary && (
        <div className="space-y-2">
          {/* Summary row */}
          <div className="flex gap-3 text-[10px]">
            <span className="text-green-600 dark:text-green-400 font-medium">
              {summary.completed} completed
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">
              {summary.active} active
            </span>
            {summary.overdue > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                {summary.overdue} overdue
              </span>
            )}
          </div>

          {/* Task list */}
          {tasks.length > 0 ? (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px]"
                >
                  <span className="text-foreground/80 truncate mr-2 flex-1">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusColors[task.status] || ""}`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${priorityColors[task.priority] || ""}`}
                    >
                      {task.priority}
                    </span>
                    {task.hoursToComplete != null && (
                      <span className="text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {task.hoursToComplete}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground py-1">
              No tasks found for this period.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { data: session } = useSession();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [toast, setToast] = useState("");

  const isManagerPlus = ["ADMIN", "PARTNER", "MANAGER"].includes(
    session?.user?.role || ""
  );

  async function fetchTeam() {
    try {
      const res = await fetch("/api/team");
      if (!res.ok) throw new Error("Failed to fetch team");
      const data = await res.json();
      setTeam(data.team);
    } catch {
      setError("Failed to load team data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeam();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const avgCompletion =
    team.length > 0
      ? Math.round(
          team.reduce((sum, m) => sum + m.stats.completionRate, 0) / team.length
        )
      : 0;

  const totalOpenTasks = team.reduce(
    (sum, m) =>
      sum + m.stats.totalTasks - m.stats.completedTasks,
    0
  );

  const totalOverdue = team.reduce((sum, m) => sum + m.stats.overdueTasks, 0);

  return (
    <div className="space-y-6 p-3 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground">My Team</h1>
          <p className="text-sm text-muted-foreground">
            {getDeptName(session?.user?.department ?? null)}
          </p>
        </div>
        {isManagerPlus && (
          <Button
            className="w-full md:w-auto bg-brand-600 hover:bg-brand-700 text-white"
            onClick={() => setShowAddEmployee(true)}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100/70 dark:bg-brand-900/40">
              <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{team.length}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgCompletion}%</p>
              <p className="text-xs text-muted-foreground">Avg Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
              <ClipboardList className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpenTasks}</p>
              <p className="text-xs text-muted-foreground">Open Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalOverdue > 0 ? "bg-red-50 dark:bg-red-950" : "bg-muted/50"}`}>
              <AlertTriangle className={`h-5 w-5 ${totalOverdue > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
                {totalOverdue}
              </p>
              <p className="text-xs text-muted-foreground">Overdue Tasks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {team.map(({ user, stats }) => (
          <Card
            key={user.id}
            className="transition-shadow hover:shadow-md border"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold ${roleAvatarColors[user.role] || "bg-muted-foreground/70"}`}
                >
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold truncate">
                    {user.name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[10px] px-1.5 py-0 font-medium ${roleBadgeColors[user.role] || ""}`}
                  >
                    {user.subRole || user.role}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {/* Progress bar */}
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {stats.completedTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In Progress</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {stats.inProgressTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Overdue</span>
                  <span
                    className={`font-medium ${stats.overdueTasks > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                  >
                    {stats.overdueTasks}
                  </span>
                </div>
              </div>

              {/* Emails + action */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{stats.emailsHandled} emails sent</span>
                </div>
                <Link href="/dashboard/workspace/tasks">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-100/70 dark:hover:bg-brand-900/40"
                  >
                    View Tasks
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>

              {/* Task History Panel */}
              <TaskHistoryPanel userId={user.id} />
            </CardContent>
          </Card>
        ))}
      </div>

      {team.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Users className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">No team members found</p>
          <p className="text-sm">
            There are no employees in your department yet.
          </p>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeModal
          department={session?.user?.department ?? null}
          onClose={() => setShowAddEmployee(false)}
          onCreated={() => {
            fetchTeam();
            setToast("Employee created");
            setTimeout(() => setToast(""), 3000);
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
