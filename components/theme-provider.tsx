"use client"

import { createContext, useContext, useEffect, useSyncExternalStore } from "react"

export type Theme = "light" | "dark" | "system"

const STORAGE_KEY = "tmx-theme"

const listeners = new Set<() => void>()
let cachedTheme: Theme | null = null

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {
    // Storage unavailable — fall through to system default
  }
  return "system"
}

function getSnapshot(): Theme {
  if (cachedTheme === null) cachedTheme = readStoredTheme()
  return cachedTheme
}

function getServerSnapshot(): Theme {
  return "system"
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function applyTheme(theme: Theme): void {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function setTheme(next: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage unavailable — theme still applies for this session
  }
  cachedTheme = next
  applyTheme(next)
  listeners.forEach((listener) => listener())
}

const ThemeContext = createContext<Theme>("system")

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // DOM side effect only (class toggle + OS preference listener) — no setState.
  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): Theme {
  return useContext(ThemeContext)
}
