"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

const THEMES = {
  green: {
    name: "Green",
    primary: "oklch(0.7 0.15 175)",
    background: "oklch(0.145 0.01 175)",
  },
  purple: {
    name: "Purple",
    primary: "oklch(0.7 0.15 290)",
    background: "oklch(0.145 0.01 290)",
  },
  pink: {
    name: "Pink",
    primary: "oklch(0.7 0.15 340)",
    background: "oklch(0.145 0.01 340)",
  },
  yellow: {
    name: "Yellow",
    primary: "oklch(0.85 0.15 95)",
    background: "oklch(0.145 0.01 95)",
  },
  orange: {
    name: "Orange",
    primary: "oklch(0.75 0.15 55)",
    background: "oklch(0.145 0.01 55)",
  },
} as const

export type ThemeKey = keyof typeof THEMES

type ThemeContextType = {
  currentTheme: ThemeKey
  setTheme: (theme: ThemeKey) => void
  themes: typeof THEMES
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>("green")

  useEffect(() => {
    const root = document.documentElement
    const theme = THEMES[currentTheme]

    root.style.setProperty("--primary", theme.primary)
    root.style.setProperty("--background", theme.background)
    root.style.setProperty("--ring", theme.primary)
    root.style.setProperty("--accent", theme.primary)
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme: setCurrentTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
