"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Settings, Clock, Save, Loader2, type LucideIcon } from "lucide-react";

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

export default function ManagerSettingsPage() {
  const { data: session } = useSession();
  const dept = session?.user?.department || null;
  const deptName = getDeptName(dept);

  const [autoAssignHours, setAutoAssignHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastUpdatedBy, setLastUpdatedBy] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const { data } = await axios.get("/api/department-settings");
        setAutoAssignHours(data.settings.autoAssignReviewHours);
        setLastUpdatedBy(data.settings.updatedBy?.name || null);
      } catch {
        // defaults are fine
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { data } = await axios.patch("/api/department-settings", {
        autoAssignReviewHours: autoAssignHours,
      });
      setLastUpdatedBy(data.settings.updatedBy?.name || null);
      toast.success("Settings saved successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
            {deptName} Settings
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Configure department workflow and automation rules
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className="inline-flex items-center rounded-full border border-brand-200/60 bg-brand-100/70 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-800/50 dark:bg-brand-900/40 dark:text-brand-300">
            {deptName}
          </span>
        </div>
      </div>

      <section>
        <SectionLabel icon={Clock}>Review Auto-Assignment</SectionLabel>
        <div className="mt-3 rounded-xl border bg-card p-4 md:p-5 shadow-xs space-y-4">
          <p className="text-sm text-muted-foreground">
            When a task is sent for review and no reviewer is assigned within this time,
            the system will automatically assign it to the Senior or Associate with the
            fewest active reviews in your department.
          </p>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap text-foreground">
              Auto-assign after:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={autoAssignHours}
                onChange={(e) =>
                  setAutoAssignHours(
                    Math.max(1, Math.min(168, parseInt(e.target.value) || 1))
                  )
                }
                className="w-20 h-9 rounded-lg border border-border bg-background px-3 text-sm text-center tabular-nums text-brand-700 dark:text-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Settings className="h-4 w-4 shrink-0" />
            <div>
              <p>Quick presets:</p>
              <div className="mt-1 flex flex-wrap gap-1 rounded-full border border-border bg-muted/50 p-1">
                {[4, 8, 12, 24, 48].map((h) => {
                  const isActive = autoAssignHours === h;
                  return (
                    <button
                      key={h}
                      onClick={() => setAutoAssignHours(h)}
                      className={`rounded-full px-3 py-1 text-xs font-medium tabular-nums transition-colors ${
                        isActive
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {h}h
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {lastUpdatedBy && (
            <p className="text-xs text-muted-foreground">
              Last updated by{" "}
              <span className="font-medium text-foreground">
                {lastUpdatedBy}
              </span>
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </section>
    </div>
  );
}
