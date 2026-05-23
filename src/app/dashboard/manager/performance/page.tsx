"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Award,
  Brain,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  History,
  Eye,
  ArrowLeft,
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

// Time-based report types
interface ReportCompletedTask {
  title: string;
  priority: string;
  hoursToComplete: number | null;
}

interface ReportEmployee {
  userId: string;
  name: string;
  score: number;
  summary: string;
  managerTips: string;
  completedTasks: ReportCompletedTask[];
}

interface TimeBasedReport {
  period: string;
  generatedAt: string;
  overallSummary: string;
  employees: ReportEmployee[];
}

interface HistoryReport {
  id: string;
  department: string;
  period: string;
  report: TimeBasedReport;
  createdAt: string;
  generatedBy: { name: string };
}

type Period = "day" | "week" | "month";

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

function ReportScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500 text-white"
      : score >= 60
        ? "bg-amber-500 text-white"
        : "bg-red-500 text-white";

  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${color}`}
    >
      {score}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    HIGH: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    LOW: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[priority] || styles.LOW}`}
    >
      {priority}
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
  const { data: session } = useSession();
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [aiReview, setAiReview] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Time-based report state
  const [reportPeriod, setReportPeriod] = useState<Period>("week");
  const [report, setReport] = useState<TimeBasedReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // History state
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([]);
  const [viewingHistoryReport, setViewingHistoryReport] = useState<HistoryReport | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const userRole = session?.user?.role;
  const userDepartment = session?.user?.department;
  const isAdminOrPartner = userRole === "ADMIN" || userRole === "PARTNER";

  useEffect(() => {
    fetchPerformanceData();
    fetchHistory();
  }, [session]);

  async function fetchPerformanceData() {
    try {
      setLoading(true);
      const res = await fetch("/api/performance");
      if (!res.ok) throw new Error("Failed to fetch performance data");
      const data: PerformanceData[] = await res.json();

      // Filter by department: MANAGER sees only their department
      if (!isAdminOrPartner && userDepartment) {
        setPerformanceData(
          data.filter((item) => item.user.department === userDepartment)
        );
      } else {
        setPerformanceData(data);
      }
    } catch (err) {
      setError("Failed to load performance data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/performance/history");
      if (!res.ok) return;
      const data = await res.json();
      setHistoryReports(data.reports || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
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

  async function generateReport() {
    try {
      setReportLoading(true);
      setReportError(null);
      const res = await fetch("/api/performance/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: reportPeriod }),
      });
      if (!res.ok) throw new Error("Failed to generate report");
      const data = await res.json();
      setReport(data);
      // Refresh history after generating a new report
      fetchHistory();
    } catch (err) {
      setReportError("Failed to generate report. Please try again.");
      console.error(err);
    } finally {
      setReportLoading(false);
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

  const periodLabels: Record<Period, string> = {
    day: "Today",
    week: "This Week",
    month: "This Month",
  };

  const periodBadgeStyles: Record<string, string> = {
    day: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    week: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    month: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  };

  function formatHistoryDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Render the report content (shared between current and history views)
  function renderReportContent(reportData: TimeBasedReport, label: string) {
    return (
      <div className="space-y-4">
        {/* Overall Summary */}
        <div className="rounded-xl bg-[#00968a] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4" />
            <h3 className="font-semibold">{label} Overview</h3>
          </div>
          <p className="text-sm leading-relaxed text-white/90">
            {reportData.overallSummary}
          </p>
        </div>

        {/* Employee Cards sorted by score */}
        <div className="grid gap-4 md:grid-cols-2">
          {[...reportData.employees]
            .sort((a, b) => b.score - a.score)
            .map((emp) => (
              <div
                key={emp.userId}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ReportScoreCircle score={emp.score} />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {emp.name}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {emp.summary}
                </p>

                {/* Manager Tips */}
                <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                    Manager Tips
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {emp.managerTips}
                  </p>
                </div>

                {/* Completed Tasks - Collapsible */}
                {emp.completedTasks && emp.completedTasks.length > 0 && (
                  <div className="mt-3">
                    <button
                      onClick={() =>
                        setExpandedEmployee(
                          expandedEmployee === emp.userId ? null : emp.userId
                        )
                      }
                      className="flex items-center gap-1 text-xs font-medium text-[#00968a] hover:underline"
                    >
                      {expandedEmployee === emp.userId ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {emp.completedTasks.length} completed task
                      {emp.completedTasks.length !== 1 ? "s" : ""}
                    </button>
                    {expandedEmployee === emp.userId && (
                      <div className="mt-2 space-y-1.5">
                        {emp.completedTasks.map((task, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs"
                          >
                            <span className="text-foreground/80 truncate mr-2">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <PriorityBadge priority={task.priority} />
                              {task.hoursToComplete != null && (
                                <span className="text-muted-foreground">
                                  {task.hoursToComplete}h
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }

  // If viewing a historical report, show it full-screen with a back button
  if (viewingHistoryReport) {
    const histReport = viewingHistoryReport.report;
    const histPeriod = viewingHistoryReport.period as Period;
    const histDate = formatHistoryDate(viewingHistoryReport.createdAt);
    const histLabel = `Report from ${histDate} - ${periodLabels[histPeriod] || histPeriod}`;

    return (
      <div className="space-y-6 pb-10">
        {/* Back bar */}
        <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-3">
          <div className="flex items-center gap-3">
            <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Historical Report
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {histLabel} -- Generated by {viewingHistoryReport.generatedBy.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setViewingHistoryReport(null);
              setExpandedEmployee(null);
            }}
            className="flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-amber-900/40 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Current
          </button>
        </div>

        {/* Render full report */}
        {renderReportContent(histReport, periodLabels[histPeriod] || histPeriod)}
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

      {/* Time-Based AI Report Section */}
      <div className="rounded-xl border border-brand-500/20 bg-gradient-to-br from-[#00968a]/5 to-[#00968a]/10 dark:from-[#00968a]/10 dark:to-[#00968a]/5 p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-[#00968a]" />
            <h2 className="text-lg font-semibold text-foreground">
              AI Period Report
            </h2>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period Selector Pills */}
            <div className="flex rounded-lg border border-border bg-muted/50 p-0.5">
              {(["day", "week", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPeriod(p)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                    reportPeriod === p
                      ? "bg-[#00968a] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
            <button
              onClick={generateReport}
              disabled={reportLoading}
              className="flex items-center gap-2 rounded-lg bg-[#00968a] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#007d73] disabled:opacity-60"
            >
              {reportLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {reportLoading && (
          <div className="mt-6 flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-[#00968a]/20" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-transparent border-t-[#00968a]" />
              <Brain className="absolute inset-0 m-auto h-6 w-6 text-[#00968a]" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground/80">
                AI is generating {periodLabels[reportPeriod].toLowerCase()} report...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Analyzing task data for {performanceData.length} employees
              </p>
            </div>
          </div>
        )}

        {reportError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            {reportError}
          </div>
        )}

        {!reportLoading && !report && (
          <p className="mt-4 text-sm text-muted-foreground">
            Select a period and click &quot;Generate Report&quot; to get an AI-powered
            performance analysis with scores, summaries, and manager tips.
          </p>
        )}
      </div>

      {/* Time-Based Report Results */}
      {report && !reportLoading && renderReportContent(
        report,
        periodLabels[reportPeriod as Period] || report.period
      )}

      {/* Report History Section */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h2 className="text-lg font-semibold text-foreground">
            Report History
          </h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {historyReports.length} reports
          </span>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
          </div>
        ) : historyReports.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <History className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">
              No reports generated yet. Generate your first report above.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Period</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Department</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Generated By</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyReports.map((hr, idx) => (
                    <tr
                      key={hr.id}
                      className={`border-b last:border-0 transition-colors hover:bg-muted/30 ${
                        idx % 2 === 1 ? "bg-muted/10" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {formatHistoryDate(hr.createdAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {timeAgo(new Date(hr.createdAt))}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            periodBadgeStyles[hr.period] || periodBadgeStyles.day
                          }`}
                        >
                          {hr.period === "day"
                            ? "Day"
                            : hr.period === "week"
                              ? "Week"
                              : hr.period === "month"
                                ? "Month"
                                : hr.period}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {hr.department.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {hr.generatedBy.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setViewingHistoryReport(hr);
                            setExpandedEmployee(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00968a]/30 bg-[#00968a]/10 px-3 py-1.5 text-xs font-medium text-[#00968a] hover:bg-[#00968a]/20 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

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
