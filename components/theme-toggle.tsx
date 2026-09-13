"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { setTheme, useTheme, type Theme } from "@/components/theme-provider"

const ORDER: Theme[] = ["light", "dark", "system"]

const LABELS: Record<Theme, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
}

const emptySubscribe = () => () => {}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme()
  // False during SSR/hydration so the label matches server HTML; true after.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const current: Theme = mounted ? theme : "light"
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])}
      aria-label={`${LABELS[current]}, click to change`}
      title={LABELS[current]}
      className={`inline-flex items-center justify-center border-2 border-foreground bg-card text-foreground px-2 sm:px-3 py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal ${className}`}
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
    </button>
  )
}
