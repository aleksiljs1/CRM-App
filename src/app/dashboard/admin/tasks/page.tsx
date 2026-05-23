"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
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
  Paperclip,
  MessageSquare,
  Send,
  Sparkles,
  Trash2,
  Filter,
} from "lucide-react";

// ---- Types ----------------------------------------------------------------

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

interface TaskStatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  changedBy?: { id: string; name: string };
}

interface TaskCommentEntry {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; role: string };
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
  attachments?: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }[];
  statusHistory?: TaskStatusHistoryEntry[];
}

interface Counts {
  todo: number;
  inProgress: number;
  review: number;
  approved: number;
  completed: number;
  overdue: number;
}

interface TeamMember {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    subRole?: string | null;
    department: string | null;
  };
}

// ---- Constants -------------------------------------------------------------

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
    color: "bg-muted text-foreground/80 dark:bg-muted dark:text-foreground/80",
    borderColor: "border-t-muted-foreground/40",
    bgColor: "bg-muted/50",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    borderColor: "border-t-blue-500",
    bgColor: "bg-blue-50/30 dark:bg-blue-950/30",
  },
  REVIEW: {
    label: "Review",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    borderColor: "border-t-amber-500",
    bgColor: "bg-amber-50/30 dark:bg-amber-950/30",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    borderColor: "border-t-brand-500",
    bgColor: "bg-teal-50/30 dark:bg-teal-950/30",
  },
  COMPLETED: {
    label: "Completed",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    borderColor: "border-t-green-500",
    bgColor: "bg-green-50/30 dark:bg-green-950/30",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: {
    label: "Urgent",
    color:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50",
  },
  HIGH: {
    label: "High",
    color:
      "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50",
  },
  MEDIUM: {
    label: "Medium",
    color:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50",
  },
  LOW: {
    label: "Low",
    color: "bg-muted text-muted-foreground border-border",
  },
};

const NEXT_STATUS: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "REVIEW",
  REVIEW: "APPROVED",
  APPROVED: "COMPLETED",
};

const DEPARTMENTS = [
  { value: "ALL", label: "All Departments" },
  { value: "AUDIT", label: "Audit" },
  { value: "ACCOUNTING_TAX", label: "Accounting & Tax" },
  { value: "BOOKKEEPING_PAYROLL", label: "Bookkeeping & Payroll" },
  { value: "LEGAL", label: "Legal" },
  { value: "ADVISORY", label: "Advisory" },
  { value: "HR", label: "HR" },
  { value: "MARKETING", label: "Marketing" },
  { value: "FINANCE", label: "Finance" },
] as const;

// ---- Helpers ---------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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
  if (diffDays <= 7)
    return { text: `Due in ${diffDays} days`, isOverdue: false };
  return {
    text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isOverdue: false,
  };
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDeptLabel(dept: string | null): string {
  if (!dept) return "No Dept";
  const found = DEPARTMENTS.find((d) => d.value === dept);
  return found ? found.label : dept.replace("_", " ");
}

// ---- Task Card -------------------------------------------------------------

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
          <Badge variant="outline" className="text-xs bg-muted/50">
            {getDeptLabel(task.department)}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={`flex items-center gap-1 ${isOverdue && task.status !== "COMPLETED" ? "text-red-600 dark:text-red-400 font-medium" : ""}`}
        >
          {isOverdue && task.status !== "COMPLETED" ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {deadlineText}
        </span>
        <div className="flex items-center gap-2 ml-2">
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}
          <span className="truncate">
            {task.assignedTo ? task.assignedTo.name.split(" ")[0] : "Unassigned"}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ---- Workflow Progress Bar -------------------------------------------------

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
                className={`w-4 h-0.5 ${isPast ? "bg-green-400" : "bg-muted"}`}
              />
            )}
            <div
              className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                isPast
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : isCurrent
                    ? "bg-brand-600 text-white"
                    : "bg-muted text-muted-foreground"
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

// ---- Comments Section ------------------------------------------------------

function CommentsSection({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<TaskCommentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    axios
      .get(`/api/tasks/${taskId}/comments`)
      .then((res) => {
        if (!cancelled) setComments(res.data.comments || []);
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load comments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function handleAdd() {
    const trimmed = body.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const res = await axios.post(`/api/tasks/${taskId}/comments`, {
        body: trimmed,
      });
      setComments((prev) => [res.data.comment, ...prev]);
      setBody("");
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        Comments
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
          {comments.length}
        </span>
      </h4>

      <div className="mb-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment for the team..."
          className="min-h-[64px] resize-none text-sm"
          disabled={posting}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            Visible to everyone on the team. Ctrl+Enter to post.
          </p>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!body.trim() || posting}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {posting ? "Posting..." : "Add comment"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">
          No comments yet. Be the first to share something with the team.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950/40 text-[11px] font-semibold text-brand-700 dark:text-brand-300">
                {getInitials(c.author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {c.author.name}
                  </p>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {c.author.role}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(c.createdAt)}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                  {c.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Task Detail Modal -----------------------------------------------------

function TaskDetailModal({
  task,
  onClose,
  onStatusChange,
  onAssignReviewer,
  onDelete,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssignReviewer: (taskId: string, reviewerId: string) => void;
  onDelete: (taskId: string) => void;
}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [progressNote, setProgressNote] = useState("");
  const [progressing, setProgressing] = useState(false);

  const { text: deadlineText, isOverdue } = formatDeadline(task.deadline);
  // Admin can do all transitions
  const nextStatus = NEXT_STATUS[task.status] || null;
  const canSendBack = task.status === "REVIEW";
  const canReset = task.status !== "TODO";
  const canAssignReviewer = task.status === "REVIEW";

  useEffect(() => {
    if (canAssignReviewer) {
      async function fetchTeam() {
        try {
          const res = await axios.get("/api/team");
          const allMembers: TeamMember[] = res.data.team || [];
          const reviewers = allMembers.filter((m) =>
            ["SENIOR", "ASSOCIATE", "MANAGER"].includes(m.user.role)
          );
          setTeamMembers(reviewers);
        } catch {
          setTeamMembers([]);
        }
      }
      fetchTeam();
    }
  }, [canAssignReviewer]);

  async function handleProgressConfirm() {
    if (!nextStatus) return;
    setProgressing(true);
    try {
      const trimmed = progressNote.trim();
      if (trimmed) {
        try {
          await axios.post(`/api/tasks/${task.id}/comments`, {
            body: `Progress note - ${STATUS_CONFIG[task.status]?.label ?? task.status} -> ${STATUS_CONFIG[nextStatus]?.label ?? nextStatus}\n\n${trimmed}`,
          });
        } catch {
          toast.error(
            "Couldn't save your note as a comment. Moving the task anyway."
          );
        }
      }
      onStatusChange(task.id, nextStatus);
      setProgressDialogOpen(false);
      setProgressNote("");
    } finally {
      setProgressing(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between p-6 pb-0 shrink-0">
          <h2 className="text-lg font-bold pr-4">{task.title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 pt-4">
          <div className="mb-4 overflow-x-auto">
            <WorkflowBar currentStatus={task.status} />
          </div>

          <Separator className="my-4" />

          {task.description && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground font-medium mb-1">
                Description
              </p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                {task.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <span className="text-muted-foreground">Priority</span>
              <div className="mt-0.5">
                <Badge
                  variant="outline"
                  className={PRIORITY_CONFIG[task.priority]?.color || ""}
                >
                  {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                </Badge>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Deadline</span>
              <p
                className={`mt-0.5 font-medium ${isOverdue && task.status !== "COMPLETED" ? "text-red-600 dark:text-red-400" : ""}`}
              >
                {deadlineText}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned to</span>
              <p className="mt-0.5">
                {task.assignedTo?.name || "Unassigned"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Created by</span>
              <p className="mt-0.5">{task.createdBy.name}</p>
            </div>
            {task.client && (
              <div>
                <span className="text-muted-foreground">Client</span>
                <p className="mt-0.5">{task.client.companyName}</p>
              </div>
            )}
            {task.department && (
              <div>
                <span className="text-muted-foreground">Department</span>
                <p className="mt-0.5">{getDeptLabel(task.department)}</p>
              </div>
            )}
          </div>

          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/attachments/${att.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">
                      {att.fileName}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {task.statusHistory && task.statusHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Status Timeline</h4>
              <div className="space-y-2">
                {task.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-24 shrink-0">
                      {timeAgo(h.changedAt)}
                    </span>
                    <span className="font-medium">
                      {h.fromStatus
                        ? `${h.fromStatus} -> ${h.toStatus}`
                        : `Created as ${h.toStatus}`}
                    </span>
                    <span className="text-muted-foreground">
                      by {h.changedBy?.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canAssignReviewer && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-950/30 dark:border-amber-800/50">
              <label className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2 block">
                Assign Reviewer
              </label>
              <select
                value={task.assignedToId || ""}
                onChange={async (e) => {
                  const reviewerId = e.target.value;
                  if (reviewerId) {
                    setReviewerLoading(true);
                    onAssignReviewer(task.id, reviewerId);
                    setReviewerLoading(false);
                  }
                }}
                disabled={reviewerLoading}
                className="w-full rounded-md border border-amber-300 dark:border-amber-800/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-card"
              >
                <option value="">Select a reviewer...</option>
                {teamMembers.map((tm) => (
                  <option key={tm.user.id} value={tm.user.id}>
                    {tm.user.role} - {tm.user.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Only Senior, Associate, or Manager can review tasks
              </p>
            </div>
          )}

          <Separator className="my-4" />

          <div className="flex flex-wrap gap-2">
            {nextStatus && (
              <Button
                className="bg-brand-600 hover:bg-brand-700 text-white"
                onClick={() => setProgressDialogOpen(true)}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Move to {STATUS_CONFIG[nextStatus]?.label}
              </Button>
            )}
            {canSendBack && (
              <Button
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800/60 dark:text-amber-300 dark:hover:bg-amber-950/40"
                onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Send Back
              </Button>
            )}
            {canReset && (
              <Button
                variant="outline"
                className="text-muted-foreground"
                onClick={() => onStatusChange(task.id, "TODO")}
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset to To Do
              </Button>
            )}
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
              onClick={() => onDelete(task.id)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete Task
            </Button>
          </div>

          <Separator className="my-4" />

          <CommentsSection taskId={task.id} />
        </div>
      </div>

      {progressDialogOpen && nextStatus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-100/70 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <ArrowRight className="size-4" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">
                    Progress this task
                  </h3>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Moving to{" "}
                    <span className="font-medium text-foreground">
                      {STATUS_CONFIG[nextStatus]?.label ?? nextStatus}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 px-6 py-5">
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground">
                Describe the work you did
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  optional
                </span>
              </label>
              <Textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                placeholder="Briefly describe what you completed before progressing the task..."
                className="min-h-[110px] resize-none text-sm"
                disabled={progressing}
                autoFocus
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleProgressConfirm();
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                If you write something, it will be posted as a team comment on
                this task. Leave it blank to just move the task.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setProgressDialogOpen(false);
                  setProgressNote("");
                }}
                disabled={progressing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProgressConfirm}
                disabled={progressing}
                className="gap-1.5 bg-brand-600 text-white hover:bg-brand-700"
              >
                <ArrowRight className="size-3.5" />
                {progressing
                  ? "Saving..."
                  : `Move to ${STATUS_CONFIG[nextStatus]?.label ?? nextStatus}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- New Task Form (Admin version with department dropdown) -----------------

function AdminNewTaskForm({
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
  const [department, setDepartment] = useState("");
  const [assignToId, setAssignToId] = useState<string>("");
  const [taskAttachments, setTaskAttachments] = useState<File[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiAssigning, setAiAssigning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await axios.get("/api/team");
        setTeamMembers(res.data.team || []);
      } catch {
        setTeamMembers([]);
      }
    }
    fetchTeam();
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setTaskAttachments((prev) => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} file(s) attached`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setTaskAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAiAssign() {
    setAiAssigning(true);
    try {
      const { data } = await axios.post("/api/tasks/ai-assign", {
        taskTitle: title,
        taskDescription: description,
        taskPriority: priority,
      });
      if (data.recommendation?.userId) {
        const found = teamMembers.find(
          (tm) => tm.user.id === data.recommendation.userId
        );
        if (found) {
          setAssignToId(data.recommendation.userId);
        } else {
          const byName = teamMembers.find(
            (tm) =>
              tm.user.name.toLowerCase() ===
              data.recommendation.name?.toLowerCase()
          );
          if (byName) {
            setAssignToId(byName.user.id);
          }
        }
        toast.success(
          `AI suggests: ${data.recommendation.name} -- ${data.recommendation.reason}`
        );
      }
    } catch {
      toast.error("AI assignment failed");
    } finally {
      setAiAssigning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      if (description) formData.append("description", description);
      formData.append("priority", priority);
      if (deadline) formData.append("deadline", deadline);
      if (department) formData.append("department", department);
      formData.append("assignedToId", assignToId);
      for (const file of taskAttachments) {
        formData.append("attachments", file);
      }
      await axios.post("/api/tasks", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Task created successfully");
      setTaskAttachments([]);
      onCreated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to create task";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-0 shrink-0">
          <h2 className="text-lg font-bold">New Task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 pt-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
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
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1 block">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground/80 mb-1 block">
                  Deadline
                </label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            {/* Department dropdown -- admin can assign any department */}
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">No department</option>
                {DEPARTMENTS.filter((d) => d.value !== "ALL").map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assign to dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-foreground/80">
                  Assign to
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={aiAssigning}
                  onClick={handleAiAssign}
                  className="gap-1.5 text-xs border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-300 dark:hover:bg-brand-950"
                >
                  {aiAssigning ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {aiAssigning ? "Thinking..." : "Assign with AI"}
                </Button>
              </div>
              <select
                value={assignToId}
                onChange={(e) => setAssignToId(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Unassigned (anyone can pick up)</option>
                {teamMembers.map((tm) => (
                  <option key={tm.user.id} value={tm.user.id}>
                    {tm.user.subRole || tm.user.role} - {tm.user.name}
                    {tm.user.department ? ` (${getDeptLabel(tm.user.department)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* File attachments */}
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Attachments
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 mr-1" />
                {taskAttachments.length > 0
                  ? `${taskAttachments.length} file(s) attached`
                  : "Attach Files"}
              </Button>
              {taskAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted/50 rounded-lg border">
                  {taskAttachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-card border rounded-lg text-xs shadow-sm"
                    >
                      <Paperclip className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                      <span className="max-w-[180px] truncate font-medium">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="ml-1 text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim()}
              className="bg-brand-600 hover:bg-brand-700 text-white"
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

// ---- Main Page -------------------------------------------------------------

export default function AdminTasksPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const role = session?.user?.role || "";

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
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, sessionStatus, router]);

  const fetchTasks = useCallback(async () => {
    try {
      const params: Record<string, string> = { mine: "false" };
      if (search.trim()) params.search = search;
      if (deptFilter !== "ALL") params.department = deptFilter;

      const res = await axios.get("/api/tasks", { params });
      setTasks(res.data.tasks);
      setCounts(res.data.counts);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter]);

  useEffect(() => {
    if (role === "ADMIN") {
      fetchTasks();
    }
  }, [fetchTasks, role]);

  // Real-time: ADMIN joins the firm:tasks room and refetches on any task
  // change anywhere in the firm. No dept filter — admin sees everything.
  useEffect(() => {
    if (role !== "ADMIN") return;
    const socket = getSocket();
    socket.emit("subscribe-tasks", { role });
    const onChange = () => {
      fetchTasks();
    };
    socket.on("task-updated", onChange);
    socket.on("task-created", onChange);
    socket.on("task-deleted", onChange);
    return () => {
      socket.off("task-updated", onChange);
      socket.off("task-created", onChange);
      socket.off("task-deleted", onChange);
    };
  }, [role, fetchTasks]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();

      const messages: Record<string, string> = {
        IN_PROGRESS: "Task started.",
        REVIEW: "Task sent for review.",
        APPROVED: "Task approved.",
        COMPLETED: "Task completed.",
        TODO: "Task reset to To Do.",
      };
      toast.success(messages[newStatus] || "Task updated.");

      if (newStatus === "REVIEW") {
        setSelectedTask(null);
      } else if (selectedTask?.id === taskId) {
        const res = await axios.get(`/api/tasks/${taskId}`);
        setSelectedTask(res.data.task);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || "Failed to update task";
      toast.error(msg);
    }
  }

  async function handleAssignReviewer(taskId: string, reviewerId: string) {
    try {
      await axios.patch(`/api/tasks/${taskId}`, { assignedToId: reviewerId });
      await fetchTasks();
      if (selectedTask?.id === taskId) {
        const res = await axios.get(`/api/tasks/${taskId}`);
        setSelectedTask(res.data.task);
      }
    } catch (err) {
      console.error("Failed to assign reviewer:", err);
    }
  }

  function tasksByStatus(status: string) {
    return tasks.filter((t) => t.status === status);
  }

  if (sessionStatus === "loading" || (session?.user?.role !== "ADMIN")) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400" />
        <span className="ml-2 text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600 dark:text-brand-400" />
        <span className="ml-2 text-muted-foreground">Loading tasks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-bold md:text-2xl">Admin Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage tasks across all departments
          </p>
        </div>
        <Button
          className="w-full bg-brand-600 hover:bg-brand-700 text-white md:w-auto"
          onClick={() => setShowNewForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setLoading(true);
            }}
            className="rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-muted text-foreground/80 hover:bg-muted dark:bg-muted dark:text-foreground/80">
          To Do: {counts.todo}
        </Badge>
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/40">
          In Progress: {counts.inProgress}
        </Badge>
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/40">
          Review: {counts.review}
        </Badge>
        <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-900/40">
          Approved: {counts.approved}
        </Badge>
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300 dark:hover:bg-green-900/40">
          Completed: {counts.completed}
        </Badge>
        {counts.overdue > 0 && (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/40">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue: {counts.overdue}
          </Badge>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="-mx-3 overflow-x-auto sm:mx-0">
        <div className="grid grid-cols-5 gap-3 min-h-[60vh] min-w-[900px] px-3 sm:min-w-0 sm:px-0">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusTasks = tasksByStatus(status);

          return (
            <div
              key={status}
              className={`flex flex-col rounded-lg border-t-4 ${config.borderColor} ${config.bgColor} border border-border`}
            >
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground/80">
                  {config.label}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs h-5 min-w-[1.25rem] justify-center"
                >
                  {statusTasks.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                {statusTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={setSelectedTask}
                  />
                ))}
                {statusTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onAssignReviewer={handleAssignReviewer}
          onDelete={async (taskId) => {
            if (!window.confirm("Delete this task? This cannot be undone."))
              return;
            try {
              await axios.delete(`/api/tasks/${taskId}`);
              toast.success("Task deleted");
              setSelectedTask(null);
              fetchTasks();
            } catch {
              toast.error("Failed to delete task");
            }
          }}
        />
      )}
      {showNewForm && (
        <AdminNewTaskForm
          onClose={() => setShowNewForm(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}
