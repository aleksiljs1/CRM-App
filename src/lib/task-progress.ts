// Shared helpers for translating Task workflow status into a coarse % progress.
//
// We model the standard task lifecycle (TODO -> IN_PROGRESS -> REVIEW ->
// APPROVED -> COMPLETED) as 5 evenly-ish spaced stops on a 0-100 scale, so the
// client dashboard can render a meaningful progress bar before a task is fully
// done. Anything not in the map (e.g. a future enum value) falls through to 0
// so an unknown status never crashes a ring or bar that consumes it.

export const TASK_STATUS_PERCENT: Record<string, number> = {
  TODO: 0,
  IN_PROGRESS: 25,
  REVIEW: 50,
  APPROVED: 75,
  COMPLETED: 100,
};

export function taskPercent(status: string): number {
  return TASK_STATUS_PERCENT[status] ?? 0;
}

/**
 * Average task progress across a list of statuses, rounded to the nearest
 * integer percent. Returns 0 for an empty list (caller decides whether that
 * means "no work" vs "all done").
 */
export function overallTasksPercent(statuses: string[]): number {
  if (statuses.length === 0) return 0;
  const total = statuses.reduce((s, st) => s + taskPercent(st), 0);
  return Math.round(total / statuses.length);
}
