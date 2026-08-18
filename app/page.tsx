"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Keyboard, ArrowRight, Github, Star } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import { getPlayerStats } from "./actions"

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

  const startGame = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    safeSetItem(NAME_KEY, trimmed)
    router.push("/game")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5 sm:p-2">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">TypeMaster</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://github.com/ausafulislam/Typing-Master"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">GitHub</span>
              {stars !== null && (
                <span className="inline-flex items-center gap-0.5 text-primary">
                  <Star className="w-3 h-3 fill-primary" />
                  {stars}
                </span>
              )}
            </a>
            <Button
              onClick={() => setOpen(true)}
              className="border-2 border-foreground bg-primary text-primary-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 sm:px-4 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              {savedName ? "Play" : "Start"}
              <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </Button>
          </div>
        </div>
      </header>

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
                    v0.2.0
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground border-2 border-foreground p-1">
              <Keyboard className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight">TypeMaster</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            &copy; 2026 Ausaf Ul Islam
          </p>
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
              className="h-11 sm:h-12 border-2 border-foreground text-center text-base sm:text-lg font-bold shadow-brutal focus-visible:ring-0 focus-visible:border-primary"
            />
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-11 sm:h-12 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase tracking-wide shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              Start Typing
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
