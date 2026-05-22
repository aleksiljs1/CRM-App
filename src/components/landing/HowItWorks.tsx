import { Mail, ListChecks, BarChart3 } from "lucide-react"

const steps = [
  {
    icon: Mail,
    title: "Emails arrive & get prioritized",
    description:
      "Incoming client mail lands in the department inbox and Gemini ranks it by urgency.",
  },
  {
    icon: ListChecks,
    title: "Work flows through tasks & documents",
    description:
      "Staff turn emails into Kanban tasks and validate client document submissions.",
  },
  {
    icon: BarChart3,
    title: "Performance & client pipeline stay visible to leadership",
    description:
      "Managers and partners track scores, deadlines, and the client pipeline in real time.",
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface-app">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="animate-fade-up text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            How it works
          </h2>
          <p className="animate-fade-up mt-4 text-muted-foreground [animation-delay:80ms]">
            From the first client email to leadership reporting — one connected
            workflow across every Kreston department.
          </p>
        </div>

        <div className="relative mt-14">
          {/* Connecting line on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-border md:block"
          />

          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <li
                  key={step.title}
                  className="animate-fade-up flex flex-col items-center text-center md:items-start md:text-left"
                  style={{ animationDelay: `${160 + index * 120}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-semibold text-brand-foreground shadow-sm">
                      {index + 1}
                    </span>
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
