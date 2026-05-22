"use client";

import { useState, useEffect } from "react";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  Mail,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle,
  ArrowUpRight,
  Target,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

interface Tips {
  strengths: string[];
  improvements: string[];
  nextGoal: string;
  motivation: string;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score > 80 ? "#22c55e" : score > 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="200" height="200" className="-rotate-90">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-sm text-gray-500 mt-1">out of 100</span>
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
  },
  {
    key: "onTimeRate" as const,
    label: "On-time Rate",
    icon: Clock,
    format: (d: PerformanceData) => `${d.onTimeRate}%`,
  },
  {
    key: "highPriorityCompleted" as const,
    label: "High Priority Done",
    icon: AlertTriangle,
    format: (d: PerformanceData) => `${d.highPriorityCompleted}`,
  },
  {
    key: "emailsHandled" as const,
    label: "Emails Handled",
    icon: Mail,
    format: (d: PerformanceData) => `${d.emailsHandled}`,
  },
  {
    key: "clientsManaged" as const,
    label: "Clients Managed",
    icon: Users,
    format: (d: PerformanceData) => `${d.clientsManaged}`,
  },
  {
    key: "avgTasksPerMonth" as const,
    label: "Avg Tasks/Month",
    icon: TrendingUp,
    format: (d: PerformanceData) => `${d.avgTasksPerMonth}`,
  },
];

export default function MyPerformancePage() {
  const [data, setData] = useState<{
    performance: PerformanceData;
    rank: number;
    totalEmployees: number;
  } | null>(null);
  const [tips, setTips] = useState<Tips | null>(null);
  const [loading, setLoading] = useState(true);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function loadTips() {
    setTipsLoading(true);
    try {
      const res = await fetch("/api/performance/me/tips", { method: "POST" });
      if (!res.ok) throw new Error("Failed to get tips");
      const result = await res.json();
      setTips(result);
    } catch {
      setError("Failed to load AI tips. Please try again.");
    } finally {
      setTipsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#00968a]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { performance: perf, rank, totalEmployees } = data;
  const score = perf.performanceScore;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-500 mt-1">
          Track your progress and find ways to grow
        </p>
      </div>

      {/* Score Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="flex flex-col items-center py-10">
          <ScoreCircle score={score} />
          <p className="mt-4 text-lg font-medium text-gray-700">
            You rank{" "}
            <span className="text-[#00968a] font-bold">#{rank}</span> out of{" "}
            {totalEmployees} employees
          </p>
          <div className="flex gap-2 mt-3">
            <Badge
              variant="secondary"
              className="bg-[#00968a]/10 text-[#00968a]"
            >
              {perf.user.role}
            </Badge>
            {perf.user.department && (
              <Badge variant="secondary">{perf.user.department}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Score Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {metricCards.map((metric) => (
            <Card key={metric.key} className="border shadow-sm">
              <CardContent className="flex items-center gap-3 py-4 px-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00968a]/10">
                  <metric.icon className="h-5 w-5 text-[#00968a]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.format(perf)}
                  </p>
                  <p className="text-xs text-gray-500">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Coach */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-[#00968a]" />
            AI Career Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!tips && !tipsLoading && (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">
                Get personalized tips to improve your performance based on your
                data.
              </p>
              <Button
                onClick={loadTips}
                className="bg-[#00968a] hover:bg-[#007d73] text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI Tips
              </Button>
            </div>
          )}

          {tipsLoading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#00968a]" />
              <p className="text-sm text-gray-500">
                Analyzing your performance...
              </p>
            </div>
          )}

          {tips && (
            <div className="space-y-6">
              {/* Strengths */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Your Strengths
                </h3>
                <ul className="space-y-2">
                  {tips.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                      <span className="text-sm text-gray-700">{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Areas to Improve
                </h3>
                <ul className="space-y-2">
                  {tips.improvements.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ArrowUpRight className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Next Goal */}
              <div className="flex items-start gap-2 rounded-lg bg-[#00968a]/5 p-4">
                <Target className="h-5 w-5 text-[#00968a] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-[#00968a]">
                    Next Goal
                  </h3>
                  <p className="text-sm text-gray-700 mt-1">{tips.nextGoal}</p>
                </div>
              </div>

              {/* Motivation */}
              <p className="text-sm italic text-[#00968a] text-center px-4">
                &ldquo;{tips.motivation}&rdquo;
              </p>

              {/* Refresh */}
              <div className="text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTips}
                  disabled={tipsLoading}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Get New Tips
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
