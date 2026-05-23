"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  ScrollText,
  FolderOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
  users: { id: string; name: string }[];
}

const ENTITY_TYPES = ["Task", "Email", "User", "Client"] as const;

function actionColor(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes("create") || lower.includes("add")) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (lower.includes("delete") || lower.includes("remove")) {
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  }
  return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      if (search) params.set("search", search);
      if (entityFilter) params.set("entity", entityFilter);
      if (userFilter) params.set("userId", userFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const json = await res.json();
      setData(json);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [page, search, entityFilter, userFilter, dateFrom, dateTo, router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchLogs();
  }, [status, session, fetchLogs, router]);

  // Debounce search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const logs = data?.logs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const users = data?.users ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-brand-700 dark:text-brand-400">
          Audit Log
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Track all system activity &middot; {total} total entries
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-1.5 mb-3">
          <Filter className="size-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Filters
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search action or entity..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Entity type */}
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* User */}
          <select
            value={userFilter}
            onChange={(e) => {
              setUserFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-600"
          >
            <option value="">All users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Date from */}
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            placeholder="From date"
          />

          {/* Date to */}
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            placeholder="To date"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-xl bg-muted">
              <FolderOpen className="size-6 text-muted-foreground" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              No audit log entries found
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || entityFilter || userFilter || dateFrom || dateTo
                ? "Try adjusting your filters."
                : "System activity will appear here."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Entity
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Entity ID
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, idx) => {
                    const isExpanded = expandedRow === log.id;
                    return (
                      <tr
                        key={log.id}
                        className={idx > 0 ? "border-t" : ""}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-foreground">
                          {log.user.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}
                          >
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="outline">{log.entity}</Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {log.entityId.length > 12
                            ? `${log.entityId.slice(0, 12)}...`
                            : log.entityId}
                        </td>
                        <td className="px-4 py-3">
                          {log.details ? (
                            <button
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : log.id)
                              }
                              className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                            >
                              {isExpanded ? (
                                <>
                                  Hide <ChevronUp className="size-3" />
                                </>
                              ) : (
                                <>
                                  View <ChevronDown className="size-3" />
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                          {isExpanded && log.details && (
                            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs text-foreground">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &middot; {total} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
