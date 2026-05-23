"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface TasksByTeamData {
  name: string;
  tasks: number;
}

interface ClientPipelineData {
  name: string;
  value: number;
  color: string;
}

function truncateLabel(value: string): string {
  if (typeof value !== "string") return value;
  return value.length > 10 ? `${value.slice(0, 10)}…` : value;
}

export function TasksByTeamChart({ data }: { data: TasksByTeamData[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
        barCategoryGap="22%"
      >
        <defs>
          <linearGradient id="brandBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-400)" />
            <stop offset="100%" stopColor="var(--color-brand-600)" />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickFormatter={truncateLabel}
          angle={-15}
          textAnchor="end"
          interval={0}
          height={50}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
          contentStyle={{
            backgroundColor: "var(--color-bg-card, var(--background))",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--foreground)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Bar dataKey="tasks" fill="url(#brandBar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ClientPipelineChart({
  data,
}: {
  data: ClientPipelineData[];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart
        data={data}
        margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
      >
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-brand-500)"
              stopOpacity={0.6}
            />
            <stop
              offset="100%"
              stopColor="var(--color-brand-700)"
              stopOpacity={0.25}
            />
          </linearGradient>
        </defs>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <PolarRadiusAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          angle={90}
          allowDecimals={false}
        />
        <Radar
          name="Clients"
          dataKey="value"
          stroke="var(--color-brand-600)"
          strokeWidth={2}
          fill="url(#radarFill)"
          fillOpacity={1}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "var(--foreground)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
