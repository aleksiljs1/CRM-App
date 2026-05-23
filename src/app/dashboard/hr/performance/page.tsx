"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Mail,
  Users,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Trophy,
  Award,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Inline section primitives (matches /dashboard/hr/ pattern) ─────────────

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {children}
      </span>
    </div>
  );
}

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

// Threshold visuals: text color, soft text glow, status label, and the
// two radial washes (top-of-card + under-ring) so the entire hero "tints"
// with the score band — green for excellent, amber for on track, red for bad.
function getScoreVisuals(score: number) {
  if (score >= 80) {
    return {
      tone: "high" as const,
      text: "text-emerald-600",
      dot: "bg-emerald-500",
      glow: "0 0 30px rgba(16,185,129,0.28)",
      label: "Excellent",
      cardWash:
        "radial-gradient(circle at top, rgba(16,185,129,0.18), transparent 70%)",
      ringGlow:
        "radial-gradient(circle at center, rgba(16,185,129,0.28), transparent 70%)",
    };
  }
  if (score >= 60) {
    return {
      tone: "mid" as const,
      text: "text-amber-600",
      dot: "bg-amber-500",
      glow: "0 0 30px rgba(245,158,11,0.28)",
      label: "On track",
      cardWash:
        "radial-gradient(circle at top, rgba(245,158,11,0.18), transparent 70%)",
      ringGlow:
        "radial-gradient(circle at center, rgba(245,158,11,0.28), transparent 70%)",
    };
  }
  return {
    tone: "low" as const,
    text: "text-red-600",
    dot: "bg-red-500",
    glow: "0 0 30px rgba(239,68,68,0.28)",
    label: "Needs focus",
    cardWash:
      "radial-gradient(circle at top, rgba(239,68,68,0.18), transparent 70%)",
    ringGlow:
      "radial-gradient(circle at center, rgba(239,68,68,0.30), transparent 70%)",
  };
}

function ScoreRing({
  score,
  animatedScore,
}: {
  score: number;
  animatedScore: number;
}) {
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const v = getScoreVisuals(score);

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width="240"
        height="240"
        viewBox="0 0 240 240"
        className="relative -rotate-90"
      >
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" />
            <stop offset="100%" stopColor="var(--color-brand-600)" />
          </linearGradient>
        </defs>

        {/* Track */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeOpacity="0.6"
          strokeWidth="10"
        />

        {/* Progress */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-[1200ms] ease-out"
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span
          className={`text-7xl font-bold tabular-nums tracking-tight ${v.text}`}
          style={{ textShadow: v.glow }}
        >
          {animatedScore}
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          out of 100
        </span>
      </div>
    </div>
  );
}

const metricCards = [
  {
    key: "tasksCompleted" as const,
    label: "Tasks Completed",
    icon: CheckSquare,
    format: (d: PerformanceData) => `${d.tasksCompleted}/${d.totalTasks}`,
    trend: "+4 this month",
    trendTone: "positive" as const,
  },
  {
    key: "onTimeRate" as const,
    label: "On-time Rate",
    icon: Clock,
    format: (d: PerformanceData) => `${d.onTimeRate}%`,
    trend: "↑ 5% vs last month",
    trendTone: "positive" as const,
  },
  {
    key: "highPriorityCompleted" as const,
    label: "High Priority Done",
    icon: AlertTriangle,
    format: (d: PerformanceData) => `${d.highPriorityCompleted}`,
    trend: "+2 this week",
    trendTone: "positive" as const,
  },
  {
    key: "emailsHandled" as const,
    label: "Emails Handled",
    icon: Mail,
    format: (d: PerformanceData) => `${d.emailsHandled}`,
    trend: "+12 this week",
    trendTone: "positive" as const,
  },
  {
    key: "clientsManaged" as const,
    label: "Clients Managed",
    icon: Users,
    format: (d: PerformanceData) => `${d.clientsManaged}`,
    trend: "Steady",
    trendTone: "muted" as const,
  },
  {
    key: "avgTasksPerMonth" as const,
    label: "Avg Tasks / Month",
    icon: TrendingUp,
    format: (d: PerformanceData) => `${d.avgTasksPerMonth}`,
    trend: "↑ 8% vs Q1",
    trendTone: "positive" as const,
  },
];

const trendToneClass: Record<"positive" | "negative" | "muted", string> = {
  positive: "text-emerald-600 dark:text-emerald-500",
  negative: "text-red-600 dark:text-red-500",
  muted: "text-muted-foreground",
};

export default function MyPerformancePage() {
  const [data, setData] = useState<{
    performance: PerformanceData;
    rank: number;
    totalEmployees: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    fetch("/api/performance/me")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Animated count-up for the score number — premium feel, zero deps.
  useEffect(() => {
    if (!data) return;
    const target = data.performance.performanceScore;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAnimatedScore(target);
      return;
    }
    const startTs = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTs) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedScore(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { performance: perf, rank, totalEmployees } = data;
  const score = perf.performanceScore;
  const visuals = getScoreVisuals(score);

  // Build a rank window centered on the user's rank (up to 5 entries).
  const windowSize = Math.min(5, Math.max(totalEmployees, 1));
  let windowStart = Math.max(1, rank - Math.floor(windowSize / 2));
  let windowEnd = windowStart + windowSize - 1;
  if (windowEnd > totalEmployees) {
    windowEnd = totalEmployees;
    windowStart = Math.max(1, windowEnd - windowSize + 1);
  }
  const rankWindow: number[] = [];
  for (let r = windowStart; r <= windowEnd; r++) rankWindow.push(r);

  const deptDisplayName = perf.user.department
    ? perf.user.department.replace(/_/g, " ")
    : "Firm-Wide";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            My Performance
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Your scorecard &middot; spot trends and find ways to grow
          </p>
        </div>
        <span className="inline-flex items-center self-start rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300 md:self-auto">
          {deptDisplayName}
        </span>
      </div>

      {/* Hero score card */}
      <section>
        <SectionLabel icon={Award}>Scorecard</SectionLabel>
        <Card className="relative mt-3 overflow-hidden rounded-xl border bg-card shadow-xs">
        <CardContent className="relative grid grid-cols-1 items-center gap-8 p-4 md:grid-cols-[auto_1fr] md:gap-12 md:p-10">
          <ScoreRing score={score} animatedScore={animatedScore} />

          <div className="space-y-5">
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 backdrop-blur">
              <span className={`size-2 rounded-full ${visuals.dot}`} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {visuals.label}
              </span>
            </div>

            {/* Rank section */}
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="size-4 text-amber-500" />
                <span>Your ranking</span>
              </div>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                #{rank}
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  of {totalEmployees} employees
                </span>
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {rankWindow.map((r) => {
                  const isMe = r === rank;
                  return (
                    <span
                      key={r}
                      className={
                        isMe
                          ? "inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg bg-brand-600 px-2 text-sm font-semibold text-white shadow-sm"
                          : "inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-lg bg-muted px-2 text-sm text-muted-foreground"
                      }
                    >
                      #{r}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Role + department chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800 dark:bg-brand-950/50 dark:text-brand-300">
                {perf.user.role}
              </span>
              {perf.user.department && (
                <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {perf.user.department.replace(/_/g, " ")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </section>

      {/* Score Breakdown */}
      <section>
        <div className="flex items-end justify-between">
          <SectionLabel icon={Gauge}>Score breakdown</SectionLabel>
          <p className="text-xs text-muted-foreground">
            Inputs into your performance score
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3">
          {metricCards.map((metric) => (
            <Card
              key={metric.key}
              className="group rounded-xl border bg-card shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300/60 hover:shadow-md"
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                    <metric.icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                  {metric.format(perf)}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {metric.label}
                </p>
                <p className={`mt-2 text-xs ${trendToneClass[metric.trendTone]}`}>
                  {metric.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

    </div>
  );
}
