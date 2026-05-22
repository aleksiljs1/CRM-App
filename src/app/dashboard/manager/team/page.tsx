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
  MANAGER: "bg-purple-100 text-purple-700 border-purple-200",
  SENIOR: "bg-blue-100 text-blue-700 border-blue-200",
  ASSOCIATE: "bg-teal-100 text-teal-700 border-teal-200",
  JUNIOR: "bg-amber-100 text-amber-700 border-amber-200",
  ASSISTANT: "bg-gray-100 text-gray-600 border-gray-200",
  INTERN: "bg-gray-100 text-gray-600 border-gray-200",
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  PARTNER: "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const roleAvatarColors: Record<string, string> = {
  MANAGER: "bg-purple-500",
  SENIOR: "bg-blue-500",
  ASSOCIATE: "bg-[#00968a]",
  JUNIOR: "bg-amber-500",
  ASSISTANT: "bg-gray-400",
  INTERN: "bg-gray-400",
  ADMIN: "bg-red-500",
  PARTNER: "bg-indigo-500",
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Add Employee</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">
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
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-transparent"
              >
                <option value="SENIOR">Senior</option>
                <option value="ASSOCIATE">Associate</option>
                <option value="JUNIOR">Junior</option>
                <option value="ASSISTANT">Assistant</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Sub-role (optional)
              </label>
              <Input
                value={subRole}
                onChange={(e) => setSubRole(e.target.value)}
                placeholder="e.g. Senior Associate, Junior Auditor"
              />
              <p className="text-xs text-gray-400 mt-1">
                Display title that replaces the role label
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Department
              </label>
              <Badge className="bg-[#00968a]/10 text-[#00968a] border-[#00968a]/20 hover:bg-[#00968a]/10">
                {getDeptName(department)}
              </Badge>
              <p className="text-xs text-gray-400 mt-1">
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
              className="bg-[#00968a] hover:bg-[#007a70] text-white"
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
        <Loader2 className="h-8 w-8 animate-spin text-[#00968a]" />
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Team</h1>
          <p className="text-sm text-gray-500">
            {getDeptName(session?.user?.department ?? null)}
          </p>
        </div>
        {isManagerPlus && (
          <Button
            className="bg-[#00968a] hover:bg-[#007a70] text-white"
            onClick={() => setShowAddEmployee(true)}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00968a]/10">
              <Users className="h-5 w-5 text-[#00968a]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{team.length}</p>
              <p className="text-xs text-gray-500">Team Members</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgCompletion}%</p>
              <p className="text-xs text-gray-500">Avg Completion</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalOpenTasks}</p>
              <p className="text-xs text-gray-500">Open Tasks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalOverdue > 0 ? "bg-red-50" : "bg-gray-50"}`}>
              <AlertTriangle className={`h-5 w-5 ${totalOverdue > 0 ? "text-red-500" : "text-gray-400"}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold ${totalOverdue > 0 ? "text-red-600" : ""}`}>
                {totalOverdue}
              </p>
              <p className="text-xs text-gray-500">Overdue Tasks</p>
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
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white text-sm font-semibold ${roleAvatarColors[user.role] || "bg-gray-400"}`}
                >
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold truncate">
                    {user.name}
                  </CardTitle>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
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
                  <span className="text-gray-500">Completion Rate</span>
                  <span className="font-medium">{stats.completionRate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-medium">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-medium text-green-600">
                    {stats.completedTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">In Progress</span>
                  <span className="font-medium text-blue-600">
                    {stats.inProgressTasks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Overdue</span>
                  <span
                    className={`font-medium ${stats.overdueTasks > 0 ? "text-red-600" : "text-gray-400"}`}
                  >
                    {stats.overdueTasks}
                  </span>
                </div>
              </div>

              {/* Emails + action */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{stats.emailsHandled} emails sent</span>
                </div>
                <Link href="/dashboard/hr/tasks">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-[#00968a] hover:text-[#00968a] hover:bg-[#00968a]/10"
                  >
                    View Tasks
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {team.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#00968a] text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
