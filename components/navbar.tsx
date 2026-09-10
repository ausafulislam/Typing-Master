"use client"

import { useEffect, useState } from "react"
import { Keyboard, Github, Star, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_VERSION } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthButton } from "@/components/auth-button"

const GITHUB_REPO = "https://github.com/ausafulislam/Typing-Master"

const linkClasses =
  "inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"

export function Navbar() {
  const pathname = usePathname()
  const [stars, setStars] = useState<number | null>(null)

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

  const links = [
    ...(pathname !== "/profile"
      ? [
          {
            href: "/profile",
            label: "Profile",
            icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
            key: "profile",
          },
        ]
      : []),
    ...(pathname !== "/verify"
      ? [
          {
            href: "/verify",
            label: "Verify",
            icon: <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />,
            key: "verify",
          },
        ]
      : []),
  ]

  return (
    <header className="print:hidden border-b-2 border-foreground bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-3">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="TypeMaster home">
          <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5 sm:p-2">
            <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">TypeMaster</h1>
          <span className="hidden md:inline-flex items-center border border-foreground/30 bg-secondary text-muted-foreground text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5">
            v{APP_VERSION}
          </span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-3 min-w-0">
          {links.map((link) => (
            <Link key={link.key} href={link.href} className={linkClasses}>
              {link.icon}
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
          <ThemeToggle />
          <AuthButton />
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
            aria-label={`GitHub repository${stars !== null ? ` (${stars} stars)` : ""}`}
          >
            <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {stars !== null && (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-primary">
                <Star className="w-3 h-3 fill-primary" />
                {stars}
              </span>
            )}
          </a>
        </nav>
      </div>
    </header>
  )
}
