import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CtaBand() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <div className="animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-16 text-center shadow-sm sm:py-20">
        <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-brand-foreground sm:text-4xl">
          Sign in to your workspace
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-brand-50">
          One platform for email triage, tasks, documents, and performance —
          ready for every department at Kreston Albania.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login">
            <Button
              size="lg"
              variant="secondary"
              className="bg-surface-card text-brand-700 hover:bg-surface-sunken"
            >
              Sign In
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
