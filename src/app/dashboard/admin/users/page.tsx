"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Plus,
  Pencil,
  KeyRound,
  Power,
  X,
  Loader2,
  CheckCircle2,
  UserPlus,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  subRole: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const ROLES = [
  "ADMIN",
  "PARTNER",
  "MANAGER",
  "SENIOR",
  "ASSOCIATE",
  "JUNIOR",
  "ASSISTANT",
  "INTERN",
];

const DEPARTMENTS = [
  "AUDIT",
  "ACCOUNTING_TAX",
  "BOOKKEEPING_PAYROLL",
  "LEGAL",
  "ADVISORY",
  "HR",
  "MARKETING",
  "FINANCE",
];

const DEPT_LABELS: Record<string, string> = {
  AUDIT: "Audit",
  ACCOUNTING_TAX: "Accounting & Tax",
  BOOKKEEPING_PAYROLL: "Bookkeeping & Payroll",
  LEGAL: "Legal",
  ADVISORY: "Advisory",
  HR: "HR",
  MARKETING: "Marketing",
  FINANCE: "Finance",
};

const roleBadgeColors: Record<string, string> = {
  ADMIN:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800",
  PARTNER:
    "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800",
  MANAGER:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  SENIOR:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  ASSOCIATE:
    "bg-brand-100/70 text-brand-700 border-brand-200 dark:bg-brand-900/40 dark:text-brand-300 dark:border-brand-800",
  JUNIOR:
    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  ASSISTANT: "bg-muted text-muted-foreground border-border",
  INTERN: "bg-muted text-muted-foreground border-border",
};

// ── User Modal ──────────────────────────────────────────────────────────────

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: UserRow | null; // null = create mode
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "ASSOCIATE");
  const [subRole, setSubRole] = useState(user?.subRole || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!isEdit && !password.trim()) return;

    setSubmitting(true);
    setFormError("");

    try {
      const method = isEdit ? "PATCH" : "POST";
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        role,
        subRole: subRole.trim() || null,
        department: department || null,
      };

      if (isEdit) {
        payload.id = user!.id;
        payload.isActive = isActive;
      } else {
        payload.password = password;
      }

      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Operation failed");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setFormError("Operation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl bg-card shadow-xl">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">
              {isEdit ? "Edit User" : "Add User"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
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
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Email *
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@kreston.al"
                required
              />
            </div>

            {!isEdit && (
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">
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
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Sub-role (optional)
              </label>
              <Input
                value={subRole}
                onChange={(e) => setSubRole(e.target.value)}
                placeholder="e.g. Senior Auditor"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {DEPT_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-foreground/80">
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    isActive ? "bg-brand-600" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
                <span className="text-xs text-muted-foreground">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                !name.trim() ||
                !email.trim() ||
                (!isEdit && !password.trim())
              }
              className="bg-brand-600 text-white hover:bg-brand-700"
            >
              {submitting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : isEdit ? (
                <Pencil className="mr-1 h-4 w-4" />
              ) : (
                <UserPlus className="mr-1 h-4 w-4" />
              )}
              {isEdit ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterActive, setFilterActive] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  async function fetchUsers() {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterDept) params.set("department", filterDept);
      if (filterRole) params.set("role", filterRole);
      if (filterActive) params.set("active", filterActive);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUsers(data.users);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filterDept, filterRole, filterActive]);

  async function handleToggleActive(user: UserRow) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(
        user.isActive
          ? `${user.name} deactivated`
          : `${user.name} activated`
      );
      fetchUsers();
    } catch {
      showToast("Failed to update status");
    }
  }

  async function handleResetPassword(user: UserRow) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, resetPassword: true }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(`Password reset to "reset123" for ${user.name}`);
    } catch {
      showToast("Failed to reset password");
    }
  }

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

  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            User Management
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {users.length} users total &middot; {activeCount} active
          </p>
        </div>
        <Button
          className="gap-2 bg-brand-600 text-white hover:bg-brand-700"
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {DEPT_LABELS[d]}
            </option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              No users found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Sub-role
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${roleBadgeColors[user.role] || ""}`}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.subRole || "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.department
                        ? DEPT_LABELS[user.department] || user.department
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setModalOpen(true);
                          }}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`rounded p-1.5 transition-colors ${
                            user.isActive
                              ? "text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/40 dark:hover:text-red-400"
                              : "text-muted-foreground hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-400"
                          }`}
                          title={user.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/40 dark:hover:text-amber-400"
                          title="Reset password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            fetchUsers();
            showToast(editingUser ? "User updated" : "User created");
          }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-white shadow-lg animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
