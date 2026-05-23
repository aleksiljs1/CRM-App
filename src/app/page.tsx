import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-100/70 via-background to-brand-50 dark:from-brand-900/30 dark:via-background dark:to-brand-950/30">
      <div className="text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-600">
          <span className="text-4xl font-bold text-white">K</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Kreston CRM
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          AI-powered client relationship management for Kreston Albania
        </p>
        <Link href="/login">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white px-8 h-11 text-base">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
