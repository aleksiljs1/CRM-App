import Link from "next/link"
import { Button } from "@/components/ui/button"
import DashboardMock from "@/components/landing/DashboardMock"

export default function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Text column */}
        <div className="flex flex-col items-start">
          <span className="animate-fade-up inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            Kreston Albania · Internal Platform
          </span>

          <h1 className="animate-fade-up mt-6 text-5xl font-semibold tracking-tight text-foreground sm:text-6xl [animation-delay:120ms]">
            The AI-powered workspace for modern accounting firms.
          </h1>

          <p className="animate-fade-up mt-6 max-w-xl text-lg text-muted-foreground [animation-delay:240ms]">
            Email triage, task workflows, client pipeline, document validation,
            and performance — unified for every department at Kreston.
          </p>

          <div className="animate-fade-up mt-8 flex flex-wrap items-center gap-3 [animation-delay:360ms]">
            <Link href="/login">
              <Button size="lg">Sign In</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="ghost">
                See what&apos;s inside
              </Button>
            </a>
          </div>
        </div>

        {/* Mock column */}
        <div className="animate-fade-up [animation-delay:480ms]">
          <DashboardMock />
        </div>
      </div>
    </section>
  )
}
