"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Render style: "icon" for a square icon button (sidebar), "labeled" for icon+label. */
  variant?: "icon" | "labeled";
  className?: string;
}

/**
 * Toggles `dark` class on <html> and persists the choice in localStorage.
 * Pairs with the inline init script in app/layout.tsx that applies the theme
 * before React hydrates (no flash of light mode).
 */
export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Sync state with the actual <html> class on mount.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore — quota / disabled storage */
    }
  }

  // Always render the same markup on server and first client render to avoid
  // hydration mismatches; the icon swap happens after `mounted` flips.
  const Icon = mounted && isDark ? Sun : Moon;
  const label = mounted && isDark ? "Switch to light mode" : "Switch to dark mode";

  if (variant === "labeled") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium",
          "text-foreground/80 hover:bg-muted hover:text-foreground transition-colors",
          className
        )}
      >
        <Icon className="size-4" />
        {mounted && isDark ? "Light mode" : "Dark mode"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md",
        "text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
        className
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}
