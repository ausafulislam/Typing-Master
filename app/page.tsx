"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Leaderboard } from "@/components/leaderboard"
import { getPlayerStats, checkNameExists } from "./actions"
import { generateSuggestions, sanitizeName } from "@/lib/name-utils"
import { APP_VERSION } from "@/lib/constants"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"

const NAME_KEY = "typing-game-nickname"

interface PlayerStats {
  wpm: number
  accuracy: number
  rank: number
}

export default function LandingPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [savedName, setSavedName] = useLocalStorageState(NAME_KEY, "")
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [nameError, setNameError] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])
  const [checkingName, setCheckingName] = useState(false)
  const [existingPlayerStats, setExistingPlayerStats] = useState<PlayerStats | null>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!savedName) return
    let cancelled = false
    getPlayerStats(savedName)
      .then((result) => {
        if (!cancelled) setStats(result)
      })
    return () => { cancelled = true }
  }, [savedName])

  // Seeds the dialog from the stored name and pre-checks it — runs on the user's
  // click, so synchronous setState here is fine.
  const openDialog = () => {
    const seed = savedName
    setName(seed)
    setNameError(false)
    setNameSuggestions([])
    setExistingPlayerStats(null)
    setOpen(true)
    const current = seed.trim()
    if (!current || current.length < 2) return
    setCheckingName(true)
    checkNameExists(current)
      .then((exists) => {
        setNameError(exists)
        setNameSuggestions(exists ? generateSuggestions(current) : [])
        if (!exists) return null
        return getPlayerStats(current)
      })
      .then((playerStats) => {
        if (playerStats) setExistingPlayerStats(playerStats)
      })
      .catch(() => {})
      .finally(() => setCheckingName(false))
  }

  // Live validation while typing in the dialog — event-driven, debounced.
  const handleNameInputChange = (value: string) => {
    setName(value)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    const current = value.trim()
    if (!current || current.length < 2) {
      setNameError(false)
      setNameSuggestions([])
      setExistingPlayerStats(null)
      setCheckingName(false)
      return
    }
    setCheckingName(true)
    debounceTimer.current = setTimeout(() => {
      checkNameExists(current)
        .then((exists) => {
          setNameError(exists)
          setNameSuggestions(exists ? generateSuggestions(current) : [])
          if (!exists) {
            setExistingPlayerStats(null)
            setCheckingName(false)
            return
          }
          return getPlayerStats(current).then((playerStats) => {
            setExistingPlayerStats(playerStats)
            setCheckingName(false)
          })
        })
        .catch(() => setCheckingName(false))
    }, 400)
  }

  const startGame = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSavedName(sanitizeName(trimmed) || trimmed)
    router.push("/game")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

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
                    v{APP_VERSION}
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
                      {stats ? `${stats.accuracy}%` : "—"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Accuracy
                    </span>
                  </div>
                  <div className="border-2 border-foreground bg-card p-3 sm:p-5 shadow-brutal flex flex-col gap-1">
                    <span className="text-2xl sm:text-4xl font-black font-mono leading-none tabular-nums text-primary">
                      {stats ? `#${stats.rank}` : "—"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Rank
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <Button
                onClick={openDialog}
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
              onChange={(e) => handleNameInputChange(e.target.value)}
              placeholder="Your name"
              aria-label="Your name"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              className={`h-11 sm:h-12 border-2 text-center text-base sm:text-lg font-bold shadow-brutal focus-visible:ring-0 focus-visible:border-primary ${
                nameError
                  ? "border-primary focus-visible:border-primary"
                  : "border-foreground"
              }`}
            />
            {nameError && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-primary text-center">
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
                        onClick={() => handleNameInputChange(suggestion)}
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
            <Link
              href="/game"
              className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              Just type — skip the name
            </Link>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
