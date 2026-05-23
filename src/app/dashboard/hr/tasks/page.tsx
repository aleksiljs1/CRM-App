"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
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

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  attachments?: { id: string; fileName: string; filePath: string; fileSize: number; mimeType: string; }[];
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
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
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
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    borderColor: "border-t-green-500",
    bgColor: "bg-green-50/30 dark:bg-green-950/30",
  },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50" },
  HIGH: {
    label: "High",
    color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50",
  },
  MEDIUM: {
    label: "Medium",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50",
  },
  LOW: { label: "Low", color: "bg-muted text-muted-foreground border-border" },
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
          <Badge variant="outline" className="text-xs bg-muted/50">
            {task.department.replace("_", " ")}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={`flex items-center gap-1 ${isOverdue && task.status !== "COMPLETED" ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
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
          <span className={`truncate ${task.status === "REVIEW" && !task.assignedTo ? "text-amber-600 dark:text-amber-400 font-medium" : ""}`}>
            {task.status === "REVIEW" && !task.assignedTo
              ? "Needs Reviewer"
              : task.status === "REVIEW" && task.assignedTo
                ? `Rev: ${task.assignedTo.name.split(" ")[0]}`
                : task.assignedTo ? task.assignedTo.name.split(" ")[0] : "Unassigned"}
          </span>
        </div>
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

// ─── Comments Section (Trello-style) ────────────────────────────────────────

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

      {/* New comment input */}
      <div className="mb-4">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment for the team…"
          className="min-h-[64px] resize-none text-sm"
          disabled={posting}
          onKeyDown={(e) => {
            // Ctrl/Cmd + Enter posts
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
            {posting ? "Posting…" : "Add comment"}
          </Button>
        </div>
      </div>

      {/* Comment list */}
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

// ─── Task Detail Modal ──────────────────────────────────────────────────────

function TaskDetailModal({
  task,
  onClose,
  onStatusChange,
  onAssignReviewer,
  userRole,
}: {
  task: Task;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
  onAssignReviewer: (taskId: string, reviewerId: string) => void;
  userRole: string;
}) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [reviewerLoading, setReviewerLoading] = useState(false);

  const { text: deadlineText, isOverdue } = formatDeadline(task.deadline);
  const isManagerPlusRole = ["ADMIN", "PARTNER", "MANAGER"].includes(userRole);
  const isReviewer = ["SENIOR", "ASSOCIATE"].includes(userRole);
  const isAssignedReviewer = task.status === "REVIEW" && isReviewer && task.assignedTo?.role !== "JUNIOR";
  const rawNextStatus = NEXT_STATUS[task.status];
  // Workers can: TODO->IN_PROGRESS, IN_PROGRESS->REVIEW
  // Assigned reviewers (SENIOR/ASSOCIATE) can also: REVIEW->APPROVED
  // Managers can do everything
  const nextStatus = rawNextStatus
    ? (isManagerPlusRole || rawNextStatus === "IN_PROGRESS" || rawNextStatus === "REVIEW"
        || (rawNextStatus === "APPROVED" && isAssignedReviewer)
        ? rawNextStatus
        : null)
    : null;
  // Only managers can complete (APPROVED → COMPLETED)
  const finalNextStatus = (nextStatus === "COMPLETED" && !isManagerPlusRole) ? null : nextStatus;
  const canSendBack = task.status === "REVIEW" && (isManagerPlusRole || isAssignedReviewer);
  const canReset = task.status !== "TODO" && isManagerPlusRole;
  const canAssignReviewer = task.status === "REVIEW" && isManagerPlusRole;

  useEffect(() => {
    if (canAssignReviewer) {
      async function fetchTeam() {
        try {
          const res = await axios.get("/api/team");
          const allMembers: TeamMember[] = res.data.team || [];
          // Filter to only SENIOR, ASSOCIATE, MANAGER roles (valid reviewers)
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Sticky header */}
        <div className="flex items-start justify-between p-6 pb-0 shrink-0">
          <h2 className="text-lg font-bold pr-4">{task.title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 pt-4">
          {/* Workflow bar */}
          <div className="mb-4 overflow-x-auto">
            <WorkflowBar currentStatus={task.status} />
          </div>

          <Separator className="my-4" />

          {/* Description */}
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

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div>
              <span className="text-muted-foreground">Priority</span>
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
                {task.status === "REVIEW" && !task.assignedTo
                  ? <span className="text-amber-600 dark:text-amber-400 font-medium">Needs Reviewer</span>
                  : task.status === "REVIEW" && task.assignedTo
                    ? <span className="text-teal-700 dark:text-teal-300 font-medium">Reviewing: {task.assignedTo.name}</span>
                    : task.assignedTo?.name || "Unassigned"}
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
                <p className="mt-0.5">{task.department.replace("_", " ")}</p>
              </div>
            )}
          </div>

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium">Attachments</h4>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((att: any) => (
                  <a key={att.id} href={`/api/attachments/${att.id}`} target="_blank"
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border rounded-lg text-xs hover:bg-muted transition-colors">
                    <Paperclip className="h-3 w-3" />
                    <span className="max-w-[150px] truncate">{att.fileName}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {task.statusHistory && task.statusHistory.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Status Timeline</h4>
              <div className="space-y-2">
                {task.statusHistory.map((h: TaskStatusHistoryEntry) => (
                  <div key={h.id} className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground w-24 shrink-0">{timeAgo(h.changedAt)}</span>
                    <span className="font-medium">
                      {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : `Created as ${h.toStatus}`}
                    </span>
                    <span className="text-muted-foreground">by {h.changedBy?.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer Assignment */}
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

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {finalNextStatus && (
              <Button
                className="bg-brand-600 hover:bg-brand-700 text-white"
                onClick={() => onStatusChange(task.id, finalNextStatus)}
              >
                <ArrowRight className="w-4 h-4 mr-1" />
                Move to {STATUS_CONFIG[finalNextStatus]?.label}
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
          </div>

          <Separator className="my-4" />

          {/* Comments — Trello-style, visible to the whole team */}
          <CommentsSection taskId={task.id} />
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
  const [assignToId, setAssignToId] = useState<string>("");
  const [taskAttachments, setTaskAttachments] = useState<File[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchTeam() {
      try {
        const res = await axios.get("/api/team");
        setTeamMembers(res.data.team || []);
      } catch {
        // Team fetch may fail for non-manager roles, that's ok
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
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setTaskAttachments((prev) => prev.filter((_, i) => i !== index));
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
      console.error("Failed to create task:", err);
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

            <div className="grid grid-cols-2 gap-4">
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

            {/* Assign to dropdown */}
            <div>
              <label className="text-sm font-medium text-foreground/80 mb-1 block">
                Assign to
              </label>
              <select
                value={assignToId}
                onChange={(e) => setAssignToId(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                <option value="">Unassigned (anyone can pick up)</option>
                {teamMembers.map((tm) => (
                  <option key={tm.user.id} value={tm.user.id}>
                    {tm.user.subRole || tm.user.role} - {tm.user.name}
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
                      <span className="max-w-[180px] truncate font-medium">{file.name}</span>
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
  const role = session?.user?.role || "";
  const canCreateTasks = ["ADMIN", "PARTNER", "MANAGER"].includes(role);
  const isManagerPlus = ["ADMIN", "PARTNER", "MANAGER"].includes(role);
  const canViewDepartment = ["ADMIN", "PARTNER", "MANAGER", "SENIOR", "ASSOCIATE"].includes(role);
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
  const [viewMode, setViewMode] = useState<"mine" | "department">(isManagerPlus ? "department" : "mine");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const effectiveMine = !canViewDepartment || viewMode === "mine";
      const params: Record<string, string> = { mine: effectiveMine ? "true" : "false" };
      if (search.trim()) params.search = search;

      const res = await axios.get("/api/tasks", { params });
      setTasks(res.data.tasks);
      setCounts(res.data.counts);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [search, viewMode]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-assign check every 60 seconds (for managers)
  useEffect(() => {
    if (!isManagerPlus) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.post("/api/tasks/auto-assign");
        if (data.assigned > 0) {
          toast.success(`${data.assigned} task(s) auto-assigned to reviewers`);
          fetchTasks();
        }
      } catch {
        // silent
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [isManagerPlus, fetchTasks]);

  async function handleStatusChange(taskId: string, newStatus: string) {
    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus });
      await fetchTasks();

      // Show success messages based on status change
      const messages: Record<string, string> = {
        IN_PROGRESS: "Task started. Good luck!",
        REVIEW: "Task sent for review successfully.",
        APPROVED: "Task approved.",
        COMPLETED: "Task completed. Well done!",
        TODO: "Task reset to To Do.",
      };
      toast.success(messages[newStatus] || "Task updated.");

      // Close modal if sent to review (task gets unassigned, leaves "My Tasks")
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{deptDisplayName} Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your work across the workflow
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canViewDepartment && (
            <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
              <button
                onClick={() => setViewMode("mine")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === "mine"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Tasks
              </button>
              <button
                onClick={() => setViewMode("department")}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  viewMode === "department"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All {deptDisplayName}
              </button>
            </div>
          )}
          {canCreateTasks && (
            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white"
              onClick={() => setShowNewForm(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Task
            </Button>
          )}
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
      <div className="grid grid-cols-5 gap-3 min-h-[60vh]">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusTasks = tasksByStatus(status);

          return (
            <div
              key={status}
              className={`flex flex-col rounded-lg border-t-4 ${config.borderColor} ${config.bgColor} border border-border`}
            >
              {/* Column header */}
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
                  <p className="text-xs text-muted-foreground text-center py-6">
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
          onAssignReviewer={handleAssignReviewer}
          userRole={role}
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
