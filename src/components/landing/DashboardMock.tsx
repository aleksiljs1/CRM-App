import {
  LayoutDashboard,
  Mail,
  ListChecks,
  Users,
  GitBranch,
} from "lucide-react"

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Mail, label: "Inbox", active: false },
  { icon: ListChecks, label: "Tasks", active: false },
  { icon: Users, label: "Clients", active: false },
]

const stats = [
  { icon: Mail, label: "Unread Emails", value: "4" },
  { icon: ListChecks, label: "Pending Tasks", value: "3" },
  { icon: Users, label: "Total Clients", value: "28" },
  { icon: GitBranch, label: "Open Processes", value: "6" },
]

type Priority = "high" | "medium" | "low"

const priorityDot: Record<Priority, string> = {
  high: "bg-destructive",
  medium: "bg-brand-500",
  low: "bg-muted-foreground/50",
}

const columns: {
  name: string
  tasks: { title: string; priority: Priority }[]
}[] = [
  {
    name: "To Do",
    tasks: [
      { title: "VAT return filing — Q1", priority: "high" },
      { title: "Collect payroll inputs", priority: "medium" },
    ],
  },
  {
    name: "In Progress",
    tasks: [{ title: "Audit fieldwork — Adriatik Sh.p.k.", priority: "high" }],
  },
  {
    name: "Review",
    tasks: [
      { title: "Contract review — lease", priority: "medium" },
      { title: "Monthly close checklist", priority: "low" },
    ],
  },
]

export default function DashboardMock() {
  return (
    <div
      aria-hidden="true"
      className="animate-float w-full rotate-1 select-none rounded-2xl border border-border bg-surface-card shadow-xl"
    >
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-36 shrink-0 flex-col gap-1 border-r border-border bg-surface-sunken/60 p-3 sm:flex">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
              K
            </div>
            <span className="text-xs font-semibold text-foreground">
              Kreston
            </span>
          </div>
          {navItems.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium ${
                item.active
                  ? "bg-brand-50 text-brand-700"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-3.5 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4">
          {/* Header strip */}
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                HR Dashboard
              </p>
              <p className="text-[10px] text-muted-foreground">
                Tuesday overview
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-6 w-6 rounded-full bg-brand-100" />
              <div className="h-6 w-6 rounded-full bg-surface-sunken" />
            </div>
          </div>

          {/* Stat cards */}
          <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-border bg-surface-card p-2.5"
              >
                <div className="mb-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
                  <stat.icon className="size-3.5" />
                </div>
                <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Kanban snippet */}
          <div className="grid grid-cols-3 gap-2">
            {columns.map((column) => (
              <div
                key={column.name}
                className="rounded-xl bg-surface-sunken/60 p-2"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-foreground">
                    {column.name}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {column.tasks.length}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {column.tasks.map((task) => (
                    <div
                      key={task.title}
                      className="rounded-lg border border-border bg-surface-card p-2 shadow-sm"
                    >
                      <p className="mb-1.5 text-[10px] font-medium leading-snug text-foreground">
                        {task.title}
                      </p>
                      <span
                        className={`block h-1.5 w-1.5 rounded-full ${priorityDot[task.priority]}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
