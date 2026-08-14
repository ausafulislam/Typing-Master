"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Keyboard, ArrowRight } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"

const NAME_KEY = "typing-game-nickname"

export default function LandingPage() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [savedName, setSavedName] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(NAME_KEY)
    if (stored) {
      setSavedName(stored)
      setName(stored)
    }
  }, [])

  const startGame = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    localStorage.setItem(NAME_KEY, trimmed)
    router.push("/game")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5">
            <Keyboard className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">TypeMaster</h1>
        </div>
        <span className="hidden sm:inline-block border-2 border-foreground bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-brutal">
          Speed / Accuracy
        </span>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col items-center gap-6">
          <span className="border-2 border-foreground bg-card px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-brutal">
            Type faster. Miss less.
          </span>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-foreground text-balance leading-[0.95]">
            Master Your <span className="bg-primary text-primary-foreground px-2 box-decoration-clone">Typing Speed</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty leading-relaxed">
            A no-nonsense typing test. Push your WPM, sharpen your accuracy, and climb the leaderboard with real-time
            feedback.
          </p>
        </div>

        <Button
          onClick={() => setOpen(true)}
          className="h-auto border-2 border-foreground bg-primary text-primary-foreground text-lg font-black uppercase tracking-wide px-8 py-4 shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal transition-all"
        >
          {savedName ? `Continue as ${savedName}` : "Start Typing Test"}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>

        {/* Leaderboard Section */}
        <Leaderboard />
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="inline-block border-2 border-foreground bg-card px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-brutal">
          © 2026 TypeMaster — Keep Practicing, Build By Ausaf Ul Islam
        </p>
      </footer>

      {/* Name Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-2 border-foreground shadow-brutal-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">
              {savedName ? `Welcome back, ${savedName}!` : "What should we call you?"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
              maxLength={20}
              className="h-12 border-2 border-foreground text-center text-lg font-bold shadow-brutal focus-visible:ring-0 focus-visible:border-primary"
            />
            <Button
              type="submit"
              disabled={!name.trim()}
              className="h-12 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase tracking-wide shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              Start Typing
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
