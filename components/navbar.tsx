"use client"

import { useCallback, useEffect, useState } from "react"
import { Keyboard, Gamepad2, ShieldCheck, Github, Star, Menu, X, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth-button"

const GITHUB_REPO = "https://github.com/ausafulislam/Typing-Master"

const baseLinkClasses =
  "inline-flex items-center gap-1 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2 sm:px-4 py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal whitespace-nowrap"

// Active tab = pressed-down blue fill with white text.
const activeLinkClasses =
  "bg-primary text-primary-foreground shadow-none translate-x-0.5 translate-y-0.5"

const links = [
  { href: "/game", label: "Play", icon: <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
  { href: "/verify", label: "Verify", icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> },
]

export function Navbar() {
  const pathname = usePathname()
  const [stars, setStars] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("https://api.github.com/repos/ausafulislam/Typing-Master")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && typeof data.stargazers_count === "number") {
          setStars(data.stargazers_count)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const closeMenu = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, closeMenu])

  return (
    <header className="print:hidden sticky top-0 z-40 border-b-2 border-foreground bg-card">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="TypeMaster home">
            <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5 sm:p-2">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">
              TypeMaster
            </h1>
          </Link>

          <div className="flex-1" />

          {/* Desktop nav: links + auth + GitHub + toggle */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1.5 sm:gap-2">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              )
            })}
            <AuthButton />
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className={baseLinkClasses}
              aria-label={`GitHub repository${stars !== null ? ` (${stars} stars)` : ""}`}
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {stars !== null && (
                <span className="inline-flex items-center gap-0.5 text-primary">
                  <Star className="w-3 h-3 fill-primary" />
                  {stars}
                </span>
              )}
            </a>
            <ThemeToggle />
          </nav>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            className="md:hidden inline-flex items-center justify-center border-2 border-foreground bg-card text-foreground px-2 py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Mobile sidebar + backdrop */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-foreground/40 transition-opacity duration-200 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMenu}
        />

        {/* Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`absolute right-0 top-0 h-full w-72 max-w-[85vw] border-l-2 border-foreground bg-card shadow-brutal flex flex-col overflow-y-auto transition-transform duration-200 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5">
                <Keyboard className="w-4 h-4" />
              </div>
              <span className="font-black uppercase tracking-tight text-foreground">Menu</span>
            </div>
            <button
              type="button"
              onClick={closeMenu}
              aria-label="Close navigation menu"
              className="inline-flex items-center justify-center border-2 border-foreground bg-card text-foreground px-2 py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav aria-label="Mobile navigation" className="flex flex-col gap-2 p-4">
            <Link
              href="/"
              onClick={closeMenu}
              aria-current={pathname === "/" ? "page" : undefined}
              className={`${baseLinkClasses} ${pathname === "/" ? activeLinkClasses : ""}`}
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Home
            </Link>
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  aria-current={isActive ? "page" : undefined}
                  className={`${baseLinkClasses} ${isActive ? activeLinkClasses : ""}`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-4 border-t-2 border-foreground flex flex-col gap-2">
            <div className="flex items-stretch gap-2">
              <AuthButton className="flex-[4] justify-center" />
              <ThemeToggle className="flex-[1]" />
            </div>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className={`${baseLinkClasses} justify-center`}
              aria-label="GitHub repository"
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              GitHub
              {stars !== null && (
                <span className="inline-flex items-center gap-0.5 text-primary">
                  <Star className="w-3 h-3 fill-primary" />
                  {stars}
                </span>
              )}
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}