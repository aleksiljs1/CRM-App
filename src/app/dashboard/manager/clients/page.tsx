"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Mail,
  CheckSquare,
  FileText,
  Clock,
  Building2,
} from "lucide-react";

interface ClientData {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  phone: string | null;
  industry: string | null;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  assignedToId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string; email: string; role: string } | null;
  submissions: { id: string; status: string; processType: { id: string; name: string; department: string } }[];
  tasks: { id: string; status: string; priority: string; deadline: string | null }[];
  emails: { id: string; isIncoming: boolean; isReplied: boolean; createdAt: string }[];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return `${Math.floor(diffMonths / 12)}y ago`;
}

function ClientCard({ client }: { client: ClientData }) {
  const activeTasks = client.tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "APPROVED"
  ).length;
  const lastEmail = client.emails[0];

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight">
          {client.companyName}
        </h4>
        {client.industry && (
          <span className="ml-2 inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
            {client.industry}
          </span>
        )}
      </div>

      <p className="text-xs text-gray-600">{client.contactName}</p>
      <p className="mb-3 text-xs text-gray-400">{client.contactEmail}</p>

      <div className="mb-3 flex items-center gap-1 text-xs text-gray-500">
        <Building2 className="h-3 w-3" />
        <span>
          {client.assignedTo ? client.assignedTo.name : "Unassigned"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
        <span className="flex items-center gap-1" title="Active tasks">
          <CheckSquare className="h-3 w-3" />
          {activeTasks}
        </span>
        <span className="flex items-center gap-1" title="Submissions">
          <FileText className="h-3 w-3" />
          {client.submissions.length}
        </span>
        {lastEmail && (
          <span className="flex items-center gap-1" title="Last email">
            <Mail className="h-3 w-3" />
            {timeAgo(lastEmail.createdAt)}
          </span>
        )}
      </div>

      <div className="mt-3 border-t pt-2 text-[10px] text-gray-400 flex items-center gap-1">
        <Clock className="h-2.5 w-2.5" />
        Created {timeAgo(client.createdAt)}
      </div>
    </div>
  );
}

const COLUMNS = [
  {
    status: "LEAD" as const,
    label: "Leads",
    borderColor: "border-t-amber-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
    icon: Users,
    cardBg: "bg-amber-500",
  },
  {
    status: "ACTIVE" as const,
    label: "Active",
    borderColor: "border-t-[#00968a]",
    bgColor: "bg-teal-50",
    textColor: "text-[#00968a]",
    icon: UserCheck,
    cardBg: "bg-[#00968a]",
  },
  {
    status: "INACTIVE" as const,
    label: "Inactive",
    borderColor: "border-t-gray-400",
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    icon: UserX,
    cardBg: "bg-gray-500",
  },
];

export default function ClientPipelinePage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients);
        }
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q)
    );
  }, [clients, search]);

  const grouped = useMemo(() => {
    return {
      LEAD: filtered.filter((c) => c.status === "LEAD"),
      ACTIVE: filtered.filter((c) => c.status === "ACTIVE"),
      INACTIVE: filtered.filter((c) => c.status === "INACTIVE"),
    };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-sm text-gray-500">Loading client pipeline...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Pipeline</h1>
        <p className="text-sm text-gray-500">
          Track clients from first contact to active engagement
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((col) => {
          const count = grouped[col.status].length;
          return (
            <Card key={col.status} className="relative overflow-hidden">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${col.cardBg}`}
                >
                  <col.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {col.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by company or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = grouped[col.status];
          return (
            <div
              key={col.status}
              className={`flex flex-col rounded-lg border border-t-4 ${col.borderColor} bg-gray-50/50`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${col.bgColor} ${col.textColor}`}
                  >
                    {col.label}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-400">
                  {items.length}
                </span>
              </div>

              {/* Column body */}
              <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3" style={{ maxHeight: "calc(100vh - 380px)" }}>
                {items.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-xs text-gray-400">
                    No clients
                  </div>
                ) : (
                  items.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
