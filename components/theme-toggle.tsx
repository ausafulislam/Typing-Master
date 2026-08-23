"use client"

import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme, type Theme } from "@/components/theme-provider"

const ORDER: Theme[] = ["light", "dark", "system"]

const LABELS: Record<Theme, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const current: Theme = mounted ? theme : "system"
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor

  return (
    <button
      type="button"
      onClick={() => setTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])}
      aria-label={LABELS[current]}
      title={LABELS[current]}
      className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
    >
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden md:inline">{current}</span>
    </button>
  )
}
