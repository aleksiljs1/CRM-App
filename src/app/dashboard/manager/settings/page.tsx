"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Clock, Save, Loader2 } from "lucide-react";

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
        <Loader2 className="h-6 w-6 animate-spin text-[#00968a]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{deptName} Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure department workflow and automation rules
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-[#00968a]" />
            Review Auto-Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            When a task is sent for review and no reviewer is assigned within this time,
            the system will automatically assign it to the Senior or Associate with the
            fewest active reviews in your department.
          </p>

          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">
              Auto-assign after:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={168}
                value={autoAssignHours}
                onChange={(e) => setAutoAssignHours(Math.max(1, Math.min(168, parseInt(e.target.value) || 1)))}
                className="w-20 h-9 rounded-lg border bg-background px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00968a]/30 focus:border-[#00968a]"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <Settings className="h-4 w-4 shrink-0" />
            <div>
              <p>Quick presets:</p>
              <div className="flex gap-2 mt-1">
                {[4, 8, 12, 24, 48].map((h) => (
                  <button
                    key={h}
                    onClick={() => setAutoAssignHours(h)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      autoAssignHours === h
                        ? "bg-[#00968a] text-white"
                        : "bg-background border hover:bg-muted"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>

          {lastUpdatedBy && (
            <p className="text-xs text-muted-foreground">
              Last updated by {lastUpdatedBy}
            </p>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#00968a] hover:bg-[#007a70] text-white"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
