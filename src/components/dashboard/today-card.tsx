import Link from "next/link";
import { Activity, Clock, Gauge, Mail, Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/* demo — no query for these metrics yet; placeholder values for the dashboard UI */
const quickStats = [
  { icon: Activity, label: "Reply rate today", value: "94%" },
  { icon: Clock, label: "Avg response", value: "1h 12m" },
  { icon: Gauge, label: "SLA", value: "On track" },
];

const shortcuts = [
  { icon: Mail, label: "Compose email", href: "/dashboard/hr/emails" },
  { icon: Plus, label: "New task", href: "/dashboard/hr/tasks" },
  { icon: UserPlus, label: "Add client", href: "/dashboard/clients" },
];

export function TodayCard() {
  return (
    <Card className="rounded-xl shadow-xs">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
            Quick stats
          </p>
          {quickStats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 py-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <s.icon className="size-4" />
              </span>
              <span className="flex-1 text-sm text-muted-foreground">
                {s.label}
              </span>
              <span className="text-sm font-medium tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>

        <div className="border-t" />

        <div>
          <p className="mb-1 px-1 text-xs uppercase tracking-wide text-muted-foreground">
            Shortcuts
          </p>
          {shortcuts.map((s) => (
            <Link key={s.label} href={s.href} className="block">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-normal"
              >
                <s.icon className="size-4" />
                {s.label}
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
