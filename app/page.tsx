"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowRight, Keyboard } from "lucide-react"
import Link from "next/link"
import { Leaderboard } from "@/components/leaderboard"
import { Navbar } from "@/components/navbar"
import { getPlayerStats, checkNameExists } from "./actions"
import { generateSuggestions } from "@/lib/name-utils"

const NAME_KEY = "typing-game-nickname"

interface PlayerStats {
  wpm: number
  accuracy: number
  rank: number
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

export default function LandingPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [savedName, setSavedName] = useState<string | null>(() => safeGetItem(NAME_KEY))
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [stars, setStars] = useState<number | null>(null)
  const [nameError, setNameError] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])
  const [checkingName, setCheckingName] = useState(false)
  const [existingPlayerStats, setExistingPlayerStats] = useState<PlayerStats | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const stored = safeGetItem(NAME_KEY)
    if (stored) {
      setSavedName(stored)
      setName(stored)
    }
  }, [])

  useEffect(() => {
    if (!savedName) return
    let cancelled = false
    getPlayerStats(savedName)
      .then((result) => {
        if (!cancelled) setStats(result)
      })
    return () => { cancelled = true }
  }, [savedName])

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
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!open) return
    const current = name.trim()
    if (!current || current.length < 2) {
      setNameError(false)
      setNameSuggestions([])
      setExistingPlayerStats(null)
      return
    }
    let cancelled = false
    setCheckingName(true)
    checkNameExists(current).then((exists) => {
      if (cancelled) return
      setNameError(exists)
      setNameSuggestions(exists ? generateSuggestions(current) : [])
      if (exists) {
        getPlayerStats(current).then((playerStats) => {
          if (!cancelled) setExistingPlayerStats(playerStats)
        })
      } else {
        setExistingPlayerStats(null)
      }
      setCheckingName(false)
    })
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const current = name.trim()
    if (!current || current.length < 2) {
      setNameError(false)
      setNameSuggestions([])
      setExistingPlayerStats(null)
      return
    }
    setCheckingName(true)
    debounceTimer.current = setTimeout(() => {
      checkNameExists(current).then((exists) => {
        setNameError(exists)
        setNameSuggestions(exists ? generateSuggestions(current) : [])
        if (exists) {
          getPlayerStats(current).then((playerStats) => {
            setExistingPlayerStats(playerStats)
          })
        } else {
          setExistingPlayerStats(null)
        }
        setCheckingName(false)
      })
    }, 400)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [name])

  const startGame = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    safeSetItem(NAME_KEY, trimmed)
    router.push("/game")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        onStartClick={() => setOpen(true)}
        savedName={savedName}
        stars={stars}
      />

      {/* Main */}
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto w-full">
          {/* Hero */}
          <section className="border-b-2 border-foreground">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-10">
              {/* Title */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-2 border-foreground bg-foreground text-background w-fit px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    v0.3.0
                  </span>
                  <span className="border-2 border-foreground bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-brutal">
                    No sign-in required
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-foreground leading-[1.05] sm:leading-[1.05] lg:leading-[1] break-words">
                  Master Your{" "}
                  <span className="bg-primary text-primary-foreground px-2 sm:px-3 box-decoration-clone">
                    Typing
                  </span>{" "}
                  Speed
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Push your typing speed to the limit. Track every keystroke, crush your accuracy, and climb the global leaderboard.
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Your Stats
                </span>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="border-2 border-foreground bg-card p-3 sm:p-5 shadow-brutal flex flex-col gap-1">
                    <span className="text-2xl sm:text-4xl font-black font-mono leading-none tabular-nums text-primary">
                      {stats?.wpm ?? 0}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Best WPM
                    </span>
                  </div>
                  <div className="border-2 border-foreground bg-card p-3 sm:p-5 shadow-brutal flex flex-col gap-1">
                    <span className="text-2xl sm:text-4xl font-black font-mono leading-none tabular-nums text-primary">
                      {stats?.accuracy ?? 0}%
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Accuracy
                    </span>
                  </div>
                  <div className="border-2 border-foreground bg-card p-3 sm:p-5 shadow-brutal flex flex-col gap-1">
                    <span className="text-2xl sm:text-4xl font-black font-mono leading-none tabular-nums text-primary">
                      #{stats?.rank ?? 0}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Rank
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={() => setOpen(true)}
                className="w-full sm:w-auto h-auto border-2 border-foreground bg-primary text-primary-foreground text-sm sm:text-base font-black uppercase tracking-wide px-6 sm:px-8 py-3 sm:py-4 shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal transition-brutal"
              >
                {savedName ? `Continue as ${savedName}` : "Start Typing Test"}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </section>

          {/* Leaderboard */}
          <section id="leaderboard">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-16 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="border-2 border-foreground bg-primary text-primary-foreground px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Live
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Global Leaderboard
                </h3>
              </div>
              <Leaderboard />
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground border-2 border-foreground p-1">
              <Keyboard className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight">TypeMaster</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/verify"
              className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Verify Certificate
            </Link>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
              &copy; 2026 Ausaf Ul Islam
            </p>
          </div>
        </div>
      </footer>

      {/* Name Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-2 border-foreground shadow-brutal-lg sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight">
              {savedName ? `Welcome back, ${savedName}!` : "What should we call you?"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {savedName
                ? "Confirm your name or change it before you start."
                : "Enter your name so we can save your scores to the leaderboard."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={startGame} className="flex flex-col gap-4 pt-2">
            <Input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              className={`h-11 sm:h-12 border-2 text-center text-base sm:text-lg font-bold shadow-brutal focus-visible:ring-0 focus-visible:border-primary ${
                nameError
                  ? "border-blue-500 focus-visible:border-blue-500"
                  : "border-foreground"
              }`}
            />
            {nameError && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-blue-600 text-center">
                  This name has existing scores. Your best score will be updated.
                </p>
                {existingPlayerStats && (
                  <div className="flex justify-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Best: <span className="text-foreground">{existingPlayerStats.wpm} WPM</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Accuracy: <span className="text-foreground">{existingPlayerStats.accuracy}%</span>
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Rank: <span className="text-foreground">#{existingPlayerStats.rank}</span>
                    </span>
                  </div>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground self-center">
                    Or try:
                  </span>
                  {nameSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setName(suggestion)}
                      className="border-2 border-foreground bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-11 sm:h-12 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase tracking-wide shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              {checkingName ? "Checking..." : "Start Typing"}
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
