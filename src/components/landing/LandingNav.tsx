"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-surface-app/80 backdrop-blur transition-shadow transition-colors duration-200",
        scrolled ? "border-b border-border shadow-sm" : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand lockup */}
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

        {/* Sign In */}
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    </header>
  );
}
