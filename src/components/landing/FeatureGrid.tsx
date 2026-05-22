import {
  Sparkles,
  KanbanSquare,
  GitBranch,
  FileCheck,
  TrendingUp,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Email Prioritization",
    description:
      "Gemini ranks the inbox so urgent client emails surface first.",
  },
  {
    icon: KanbanSquare,
    title: "Task Workflow Kanban",
    description:
      "To Do, In Progress, Review, Approved, Completed — with deadlines and assignees.",
  },
  {
    icon: GitBranch,
    title: "Client Pipeline",
    description:
      "Lead, Active, and Inactive accounts, owned by managers and partners.",
  },
  {
    icon: FileCheck,
    title: "Document Validation",
    description:
      "Clients submit files and AI matches them to the required documents per process.",
  },
  {
    icon: TrendingUp,
    title: "Performance Tracking",
    description: "Personal scores, a team leaderboard, and AI coaching tips.",
  },
  {
    icon: LayoutDashboard,
    title: "Role-Based Dashboards",
    description:
      "Tailored views for Admin, Partner, Manager, Senior, Associate, Junior, Assistant, Intern, and Client.",
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="bg-surface-app">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your firm runs on
          </h2>
          <p className="mt-3 text-muted-foreground">
            One workspace for email, tasks, clients, documents, and performance —
            built for every department at Kreston.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="animate-fade-up rounded-2xl border border-border bg-surface-card p-6 shadow-sm transition-shadow hover:shadow-md"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
