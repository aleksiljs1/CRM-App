"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Search,
  Loader2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface Counts {
  todo: number;
  inProgress: number;
  review: number;
  approved: number;
  completed: number;
  overdue: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "APPROVED",
  "COMPLETED",
] as const;

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; borderColor: string; bgColor: string }
> = {
  TODO: {
    label: "To Do",
    color: "bg-gray-100 text-gray-700",
    borderColor: "border-t-gray-400",
    bgColor: "bg-gray-50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700",
    borderColor: "border-t-blue-500",
    bgColor: "bg-blue-50/30",
  },
  REVIEW: {
    label: "Review",
    color: "bg-amber-100 text-amber-700",
    borderColor: "border-t-amber-500",
    bgColor: "bg-amber-50/30",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-teal-100 text-teal-700",
    borderColor: "border-t-[#00968a]",
    bgColor: "bg-teal-50/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    borderColor: "border-t-green-500",
    bgColor: "bg-green-50/30",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200" },
  HIGH: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  MEDIUM: {
    label: "Medium",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  LOW: { label: "Low", color: "bg-gray-100 text-gray-600 border-gray-200" },
};

const NEXT_STATUS: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  REVIEW: "APPROVED",
  APPROVED: "COMPLETED",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDeadline(deadline: string | null): {
  text: string;
  isOverdue: boolean;
} {
  if (!deadline) return { text: "No deadline", isOverdue: false };
  const d = new Date(deadline);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)
    return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
  if (diffDays === 0) return { text: "Due today", isOverdue: false };
  if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
  if (diffDays <= 7) return { text: `Due in ${diffDays} days`, isOverdue: false };
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isOverdue: false,
  };
}

// ─── Task Card ──────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: (t: Task) => void;
}) {
  const { text: deadlineText, isOverdue } = formatDeadline(task.deadline);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

  return (
    <Card
      className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue && task.status !== "COMPLETED"
          ? "border-l-4 border-l-red-500"
          : ""
      }`}
      onClick={() => onClick(task)}
    >
      <h4 className="font-semibold text-sm leading-snug mb-2">{task.title}</h4>

      <div className="flex flex-wrap gap-1 mb-2">
        <Badge variant="outline" className={`text-xs ${priority.color}`}>
          {priority.label}
        </Badge>
        {task.client && (
          <Badge variant="outline" className="text-xs">
            {task.client.companyName}
          </Badge>
        )}
        {task.department && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            {task.department.replace("_", " ")}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className={`flex items-center gap-1 ${isOverdue && task.status !== "COMPLETED" ? "text-red-600 font-medium" : ""}`}>
          {isOverdue && task.status !== "COMPLETED" ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {deadlineText}
        </span>
        {task.assignedTo && (
          <span className="truncate ml-2">{task.assignedTo.name.split(" ")[0]}</span>
        )}
      </div>
    </Card>
  );
}

// ─── Workflow Progress Bar ──────────────────────────────────────────────────

function WorkflowBar({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STATUSES.indexOf(
    currentStatus as (typeof STATUSES)[number]
  );

  return (
    <div className="flex items-center gap-1">
      {STATUSES.map((s, i) => {
        const config = STATUS_CONFIG[s];
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;

        return (
          <div key={s} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`w-4 h-0.5 ${isPast ? "bg-green-400" : "bg-gray-200"}`}
              />
            )}
            <div
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isPast
                  ? "bg-green-100 text-green-700"
                  : isCurrent
                    ? "bg-[#00968a] text-white"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {config.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Task Detail Modal ──────────────────────────────────────────────────────

function TaskDetailModal({
  task,
  onClose,
  onStatusChange,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}) {
  const { text: deadlineText, isOverdue } = formatDeadline(task.deadline);
  const nextStatus = NEXT_STATUS[task.status];
  const canSendBack = task.status === "REVIEW";
  const canReset = task.status !== "TODO";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold pr-4">{task.title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Workflow bar */}
          <div className="mb-4 overflow-x-auto">
            <WorkflowBar currentStatus={task.status} />
          </div>

          <Separator className="my-4" />

          {/* Description */}
          {task.description && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 font-medium mb-1">
                Description
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <span className="text-gray-500">Priority</span>
              <div className="mt-0.5">
                <Badge
                  variant="outline"
                  className={
                    PRIORITY_CONFIG[task.priority]?.color || ""
                  }
                >
                  {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Deadline</span>
              <p
                className={`mt-0.5 font-medium ${isOverdue && task.status !== "COMPLETED" ? "text-red-600" : ""}`}
              >
                {deadlineText}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Assigned to</span>
              <p className="mt-0.5">{task.assignedTo?.name || "Unassigned"}</p>
            </div>
            <div>
              <span className="text-gray-500">Created by</span>
              <p className="mt-0.5">{task.createdBy.name}</p>
            </div>
            {task.client && (
              <div>
                <span className="text-gray-500">Client</span>
                <p className="mt-0.5">{task.client.companyName}</p>
              </div>
            )}
            {task.department && (
              <div>
                <span className="text-gray-500">Department</span>
                <p className="mt-0.5">{task.department.replace("_", " ")}</p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {nextStatus && (
              <Button
                className="bg-[#00968a] hover:bg-[#007a70] text-white"
                onClick={() => onStatusChange(task.id, nextStatus)}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Move to {STATUS_CONFIG[nextStatus]?.label}
              </Button>
            )}
            {canSendBack && (
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Send Back
              </Button>
            )}
            {canReset && (
              <Button
                variant="outline"
                className="text-gray-500"
                onClick={() => onStatusChange(task.id, "TODO")}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset to To Do
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── New Task Form ──────────────────────────────────────────────────────────

function NewTaskForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await axios.post("/api/tasks", {
        title,
        description: description || undefined,
        priority,
        deadline: deadline || undefined,
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">New Task</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00968a] focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-[#00968a] hover:bg-[#007a70] text-white"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

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

export default function HRTasksPage() {
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptDisplayName = getDeptName(dept);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState<Counts>({
    todo: 0,
    inProgress: 0,
    review: 0,
    approved: 0,
    completed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string> = { mine: "true" };
      if (search.trim()) params.search = search;

      const res = await axios.get("/api/tasks", { params });
      setTasks(res.data.tasks);
      setCounts(res.data.counts);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();
      // Update the selected task if it's still open
      if (selectedTask?.id === taskId) {
        const res = await axios.get(`/api/tasks/${taskId}`);
        setSelectedTask(res.data.task);
      }
    } catch (err) {
      console.error("Failed to update task:", err);
    }
  }

  function tasksByStatus(status: string) {
    return tasks.filter((t) => t.status === status);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#00968a]" />
        <span className="ml-2 text-gray-500">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{deptDisplayName} Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your work across the workflow
          </p>
        </div>
        <Button
          className="bg-[#00968a] hover:bg-[#007a70] text-white"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          To Do: {counts.todo}
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          In Progress: {counts.inProgress}
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          Review: {counts.review}
        </Badge>
        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100">
          Approved: {counts.approved}
        </Badge>
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          Completed: {counts.completed}
        </Badge>
        {counts.overdue > 0 && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue: {counts.overdue}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-3 min-h-[60vh]">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusTasks = tasksByStatus(status);

          return (
            <div
              key={status}
              className={`flex flex-col rounded-lg border-t-4 ${config.borderColor} ${config.bgColor} border border-gray-200`}
            >
              {/* Column header */}
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  {config.label}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs h-5 min-w-[1.25rem] justify-center"
                >
                  {statusTasks.length}
                </Badge>
              </div>

              {/* Tasks */}
              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={setSelectedTask}
                  />
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
        />
      )}
      {showNewForm && (
        <NewTaskForm
          onClose={() => setShowNewForm(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
