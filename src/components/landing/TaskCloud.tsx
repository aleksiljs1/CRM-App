import {
  ShieldCheck,
  Calculator,
  BookOpen,
  Scale,
  Lightbulb,
  Users,
  Megaphone,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface Department {
  icon: LucideIcon;
  name: string;
  tasks: string[];
}

const departments: Department[] = [
  {
    icon: ShieldCheck,
    name: "Audit",
    tasks: [
      "Audit fieldwork",
      "Risk assessment",
      "Internal controls review",
      "Substantive testing",
      "Year-end audit report",
    ],
  },
  {
    icon: Calculator,
    name: "Accounting & Tax",
    tasks: [
      "VAT return filing",
      "Corporate tax return",
      "Tax compliance review",
      "Quarterly tax estimate",
    ],
  },
  {
    icon: BookOpen,
    name: "Bookkeeping & Payroll",
    tasks: [
      "Monthly payroll processing",
      "Bank reconciliation",
      "Ledger posting",
      "Trial balance prep",
    ],
  },
  {
    icon: Scale,
    name: "Legal",
    tasks: [
      "Contract review",
      "Compliance filing",
      "Corporate registration",
      "Due diligence review",
    ],
  },
  {
    icon: Lightbulb,
    name: "Advisory",
    tasks: [
      "Cash flow forecasting",
      "Business valuation",
      "Financial modeling",
      "Restructuring plan",
    ],
  },
  {
    icon: Users,
    name: "HR & Payroll",
    tasks: [
      "Employee onboarding",
      "Leave management",
      "Performance review cycle",
      "Recruitment screening",
    ],
  },
  {
    icon: Megaphone,
    name: "Marketing",
    tasks: [
      "Campaign planning",
      "Client newsletter",
      "Proposal design",
      "Event coordination",
    ],
  },
  {
    icon: Wallet,
    name: "Finance",
    tasks: [
      "Budget preparation",
      "Management reporting",
      "Variance analysis",
      "Cash position review",
    ],
  },
];

export default function TaskCloud() {
  return (
    <section className="bg-surface-card">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A task type for every workflow
          </h2>
          <p className="mt-3 text-muted-foreground">
            From audit fieldwork to payroll runs — every department tracks its
            real work in the same place.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2">
          {departments.map((department, index) => {
            const Icon = department.icon;
            return (
              <div
                key={department.name}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon
                    className="h-4 w-4 text-brand-600"
                    aria-hidden="true"
                  />
                  {department.name}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {department.tasks.map((task) => (
                    <span
                      key={task}
                      className="rounded-full bg-surface-sunken px-3 py-1 text-sm text-foreground"
                    >
                      {task}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
