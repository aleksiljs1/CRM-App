"use client";

import { toast } from "sonner";
import { AlertCircle, CheckCircle2, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ActionItem {
  id: string;
  /** The name of the required document, e.g. "Trial Balance" */
  requiredDocName: string;
  /** The process type name, e.g. "Annual Audit" */
  processTypeName: string;
}

const MAX_VISIBLE = 8;

export function ActionItemsPanel({ items }: { items: ActionItem[] }) {
  // All caught up — show the success state.
  if (items.length === 0) {
    return (
      <div className="mt-3 flex items-start gap-3 rounded-xl border border-emerald-200/70 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/40">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
          <CheckCircle2 className="size-4" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            You&apos;re all caught up
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Nothing pending from your side right now.
          </p>
        </div>
      </div>
    );
  }

  const visible = items.slice(0, MAX_VISIBLE);
  const remaining = items.length - visible.length;

  const handleNotify = () => {
    // Purely visual for now — backend wiring is intentionally out of scope.
    toast.success("Your team has been notified");
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-amber-200/60 bg-amber-50 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/40">
      <ul className="divide-y divide-amber-200/60 dark:divide-amber-900/40">
        {visible.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 px-4 py-3 sm:px-5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
              <AlertCircle className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {item.requiredDocName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                For: {item.processTypeName}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNotify}
              className="shrink-0 gap-1.5 border-amber-300/70 bg-card text-amber-800 hover:bg-amber-100 dark:border-amber-800/60 dark:text-amber-200 dark:hover:bg-amber-900/40"
            >
              <BellRing className="size-3.5" />
              Notify your team
            </Button>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <div className="border-t border-amber-200/60 bg-amber-100/50 px-4 py-2 text-center text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300 sm:px-5">
          and {remaining} more
        </div>
      )}
    </div>
  );
}
