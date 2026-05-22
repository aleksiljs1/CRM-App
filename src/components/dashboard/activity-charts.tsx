"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface DayPoint {
  day: string;
  value: number;
}

/* Demo fallback — used by dashboards that haven't been wired to real data yet
   (e.g. admin / partner / client). HR passes real aggregated data via `data`. */
const demoEmailsData: DayPoint[] = [
  { day: "May 10", value: 12 },
  { day: "May 11", value: 18 },
  { day: "May 12", value: 9 },
  { day: "May 13", value: 22 },
  { day: "May 14", value: 17 },
  { day: "May 15", value: 25 },
  { day: "May 16", value: 14 },
  { day: "May 17", value: 30 },
  { day: "May 18", value: 21 },
  { day: "May 19", value: 28 },
  { day: "May 20", value: 16 },
  { day: "May 21", value: 33 },
  { day: "May 22", value: 24 },
  { day: "May 23", value: 19 },
];

const demoTasksData: DayPoint[] = [
  { day: "May 10", value: 5 },
  { day: "May 11", value: 8 },
  { day: "May 12", value: 6 },
  { day: "May 13", value: 11 },
  { day: "May 14", value: 9 },
  { day: "May 15", value: 12 },
  { day: "May 16", value: 7 },
  { day: "May 17", value: 14 },
  { day: "May 18", value: 10 },
  { day: "May 19", value: 13 },
  { day: "May 20", value: 8 },
  { day: "May 21", value: 16 },
  { day: "May 22", value: 11 },
  { day: "May 23", value: 9 },
];

const tooltipStyle = {
  backgroundColor: "var(--card, #ffffff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: "10px",
  fontSize: "12px",
  padding: "6px 10px",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
} as const;

const axisTick = { fontSize: 11, fill: "var(--muted-foreground, #6b7280)" } as const;

interface ChartProps {
  /** Line + fill color (CSS color string). */
  color: string;
  /** Unique id for the SVG gradient def — required when multiple charts share a page. */
  gradientId: string;
  data: DayPoint[];
}

function AreaChartCard({ color, gradientId, data }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="var(--border, #e5e7eb)"
          strokeOpacity={0.3}
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          interval={2}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          labelStyle={{ color: "var(--muted-foreground, #6b7280)" }}
          cursor={{ stroke: color, strokeOpacity: 0.4, strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4, strokeWidth: 0, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface PublicChartProps {
  /** Real series of last-N-days {day, value} from the server. Omit to use demo data. */
  data?: DayPoint[];
}

export function EmailsAreaChart({ data }: PublicChartProps = {}) {
  return (
    <AreaChartCard
      color="#10b981"
      gradientId="emails-area-gradient"
      data={data ?? demoEmailsData}
    />
  );
}

export function TasksAreaChart({ data }: PublicChartProps = {}) {
  return (
    <AreaChartCard
      color="#8b5cf6"
      gradientId="tasks-area-gradient"
      data={data ?? demoTasksData}
    />
  );
}
