"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Award,
  Brain,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

interface PerformanceData {
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
  onTimeRate: number;
  highPriorityCompleted: number;
  avgTasksPerMonth: number;
  emailsHandled: number;
  clientsManaged: number;
}

interface RaiseRecommendation {
  userId: string;
  name: string;
  score: number;
  recommendation: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
}

interface NeedsAttention {
  userId: string;
  name: string;
  score: number;
  issue: string;
  details: string;
}

interface BurnoutRisk {
  userId: string;
  name: string;
  riskLevel: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
}

interface DepartmentInsight {
  department: string;
  status: "OVERLOADED" | "BALANCED" | "UNDERUTILIZED";
  recommendation: string;
}

interface AIReview {
  raiseRecommendations: RaiseRecommendation[];
  needsAttention: NeedsAttention[];
  burnoutRisk: BurnoutRisk[];
  departmentInsights: DepartmentInsight[];
  summary: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800"
      : score >= 60
        ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800"
        : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800";

  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full border-2 text-sm font-bold ${color}`}
    >
      {score}
    </span>
  );
}

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    HIGH: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    LOW: "bg-muted/50 text-muted-foreground border-border",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[level] || styles.LOW}`}
    >
      {level}
    </span>
  );
}

function DeptStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    OVERLOADED: {
      bg: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
      text: "text-red-700 dark:text-red-300",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    BALANCED: {
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
    UNDERUTILIZED: {
      bg: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-300",
      icon: <Clock className="h-3.5 w-3.5" />,
    },
  };
  const c = config[status] || config.BALANCED;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.icon}
      {status}
    </span>
  );
}

export default function PerformancePage() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  async function fetchPerformanceData() {
    try {
      setLoading(true);
      const res = await fetch("/api/performance");
      if (!res.ok) throw new Error("Failed to fetch performance data");
      const data = await res.json();
      setPerformanceData(data);
    } catch (err) {
      setError("Failed to load performance data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function runAIAnalysis() {
    try {
      setAiLoading(true);
      setError(null);
      const res = await fetch("/api/performance/ai-review", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate AI review");
      const data = await res.json();
      setAiReview(data);
      setLastAnalysis(new Date());
    } catch (err) {
      setError("AI analysis failed. Please try again.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
          <p className="text-sm text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100/70 dark:bg-brand-900/40">
            <Brain className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              AI Performance Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Data-driven employee insights and raise recommendations
            </p>
          </div>
        </div>
      </div>

      {/* AI Executive Summary */}
      <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-brand-50 to-brand-100/40 dark:from-brand-950/40 dark:to-brand-900/20 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h2 className="text-lg font-semibold text-foreground">
              AI Executive Summary
            </h2>
            {lastAnalysis && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(lastAnalysis)}
              </span>
            )}
          </div>
          <button
            onClick={runAIAnalysis}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Run AI Analysis
              </>
            )}
          </button>
        </div>

        {aiLoading && (
          <div className="mt-6 flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-brand-500/20" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-brand-600 dark:border-t-brand-400" />
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground/80">AI is analyzing performance data...</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Evaluating {performanceData.length} employees across all departments
              </p>
            </div>
          </div>
        )}

        {!aiLoading && aiReview?.summary && (
          <p className="mt-4 text-sm leading-relaxed text-foreground/80">
            {aiReview.summary}
          </p>
        )}

        {!aiLoading && !aiReview && (
          <p className="mt-4 text-sm text-muted-foreground">
            Click &quot;Run AI Analysis&quot; to generate an executive summary with raise recommendations,
            burnout risk alerts, and department health insights.
          </p>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* AI Results Sections */}
      {aiReview && (
        <>
          {/* Raise Recommendations */}
          {aiReview.raiseRecommendations?.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-lg font-semibold text-foreground">
                  Raise Recommendations
                </h2>
                <span className="rounded-full bg-brand-100/70 dark:bg-brand-900/40 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-300">
                  {aiReview.raiseRecommendations.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {aiReview.raiseRecommendations.map((rec, i) => {
                  const perf = performanceData.find(
                    (p) => p.user.id === rec.userId
                  );
                  return (
                    <div
                      key={rec.userId || i}
                      className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <ScoreBadge score={rec.score} />
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {rec.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {perf?.user.role || "Employee"} &middot;{" "}
                              {perf?.user.department || "N/A"}
                            </p>
                          </div>
                        </div>
                        <ConfidenceBadge level={rec.confidence} />
                      </div>
                      <ul className="mt-4 space-y-1.5">
                        {rec.reasons.map((reason, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <ChevronRight className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-brand-600 dark:text-brand-400" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex gap-2">
                        <button className="rounded-lg bg-brand-100/70 dark:bg-brand-900/40 px-3 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-300 transition-colors hover:bg-brand-200/70 dark:hover:bg-brand-900/60">
                          Schedule Review
                        </button>
                        <button className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70">
                          Acknowledge
                        </button>
                        <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground/80">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Needs Attention */}
          {aiReview.needsAttention?.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Needs Attention
                </h2>
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  {aiReview.needsAttention.length}
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {aiReview.needsAttention.map((item, i) => (
                  <div
                    key={item.userId || i}
                    className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          {item.issue}
                        </span>
                      </div>
                      <ScoreBadge score={item.score} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.details}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Burnout Risk */}
          {aiReview.burnoutRisk?.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Burnout Risk
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {aiReview.burnoutRisk.map((item, i) => {
                  const riskColor =
                    item.riskLevel === "HIGH"
                      ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30"
                      : item.riskLevel === "MEDIUM"
                        ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"
                        : "border-border bg-muted/30";
                  const riskBadge =
                    item.riskLevel === "HIGH"
                      ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      : item.riskLevel === "MEDIUM"
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                        : "bg-muted text-muted-foreground";
                  return (
                    <div
                      key={item.userId || i}
                      className={`rounded-xl border p-4 shadow-sm ${riskColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {item.name}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${riskBadge}`}
                        >
                          {item.riskLevel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Department Health */}
          {aiReview.departmentInsights?.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-lg font-semibold text-foreground">
                  Department Health
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {aiReview.departmentInsights.map((dept, i) => (
                  <div
                    key={dept.department || i}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {dept.department}
                      </h3>
                      <DeptStatusBadge status={dept.status} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {dept.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Performance Scores Table */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Employee Performance Scores
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {performanceData.length} employees
          </span>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Rank</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Dept</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Tasks</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">On-Time</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">High Pri</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Avg/Mo</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Emails</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">Clients</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((item, idx) => (
                  <tr
                    key={item.user.id}
                    className="border-b last:border-0 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{item.user.name}</p>
                        <p className="text-xs text-muted-foreground">{item.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.user.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.user.department || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          item.performanceScore >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : item.performanceScore >= 60
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        }`}
                      >
                        {item.performanceScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.tasksCompleted}/{item.totalTasks}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.onTimeRate}%
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.highPriorityCompleted}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.avgTasksPerMonth}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.emailsHandled}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {item.clientsManaged}
                    </td>
                  </tr>
                ))}
                {performanceData.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No employee performance data available
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
