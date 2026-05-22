import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-surface-app">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand lockup + line */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-base font-bold text-brand-foreground">
              K
            </span>
            <span className="text-base font-semibold text-foreground">
              Kreston CRM
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Internal platform for Kreston Albania · © 2026
          </p>
        </div>

        {/* Placeholder links */}
        <nav className="flex items-center gap-6">
          <a
            href="#"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app"
          >
            Privacy
          </a>
          <a
            href="#"
            className="rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app"
          >
            Status
          </a>
        </nav>
      </div>
    </footer>
  );
}
