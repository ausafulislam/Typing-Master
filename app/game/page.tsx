"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart3, Loader2, Check, ArrowLeft, Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { saveGameSession } from "../actions"

const NAME_KEY = "typing-game-nickname"

const SAMPLE_TEXTS = [
  "The quick brown fox jumps over the lazy dog while the moon shines bright in the darkening sky above the hills where ancient trees stand tall and proud among the whispering winds that carry tales of old adventures and forgotten dreams across the vast expanse of time and space.",
  "In the heart of the forest where shadows dance between towering oaks and pines there lives a community of creatures both large and small who work together to maintain the delicate balance of nature through seasons of change and growth where every leaf and branch tells a story of survival and adaptation.",
  "Technology advances at an incredible pace bringing new innovations and discoveries that reshape our world and challenge our understanding of what is possible as we venture into uncharted territories of science and exploration seeking answers to questions that have puzzled humanity for generations while creating new mysteries.",
  "Music flows through the air like liquid gold touching hearts and souls with melodies that transcend language and culture bringing people together in moments of pure joy and celebration where rhythm and harmony create a universal language that speaks to the deepest parts of our human experience.",
  "The ocean waves crash against the rocky shore in an eternal dance of power and grace where countless mysteries lie hidden beneath the surface waiting to be discovered by brave explorers who dare to venture into the depths where light fades and pressure builds creating an alien world.",
]

const KEYBOARD_LAYOUT = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
]

export default function TypingGame() {
  const [sampleText, setSampleText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLimit, setTimeLimit] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [typedChars, setTypedChars] = useState<boolean[]>([])
  const [errors, setErrors] = useState(0)
  const [totalTyped, setTotalTyped] = useState(0)
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [errorFlash, setErrorFlash] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [nickname, setNickname] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)

  const resetGame = useCallback(() => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)]
    setSampleText(randomText)
    setCurrentIndex(0)
    setTimeLeft(timeLimit)
    setIsActive(false)
    setIsFinished(false)
    setTypedChars([])
    setErrors(0)
    setTotalTyped(0)
    setPressedKey(null)
    setErrorFlash(false)
    setShowResults(false)
    setHasSaved(false)
  }, [timeLimit])

  useEffect(() => {
    const storedNickname = localStorage.getItem(NAME_KEY)
    if (storedNickname) {
      setNickname(storedNickname)
    }
  }, [])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsActive(false)
            setIsFinished(true)
            setShowResults(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isActive, timeLeft])

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (isFinished || currentIndex >= sampleText.length) return

      const key = e.key
      if (key.length > 1 && key !== " ") return

      if (!isActive) setIsActive(true)

      setPressedKey(key === " " ? "Space" : key.toLowerCase())
      setTimeout(() => setPressedKey(null), 200)

      const expectedChar = sampleText[currentIndex]
      setTotalTyped((prev) => prev + 1)

      if (key === expectedChar) {
        setTypedChars((prev) => {
          const newTyped = [...prev]
          newTyped[currentIndex] = true
          return newTyped
        })
        setCurrentIndex((prev) => prev + 1)
      } else {
        setErrors((prev) => prev + 1)
        setErrorFlash(true)
        setTimeout(() => setErrorFlash(false), 200)
      }
    },
    [isFinished, currentIndex, sampleText, isActive],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [handleKeyPress])

  const wpm = Math.round(currentIndex / 5 / ((timeLimit - timeLeft) / 60)) || 0
  const accuracy = totalTyped > 0 ? Math.round(((totalTyped - errors) / totalTyped) * 100) : 100

  const changeTimeLimit = (newLimit: number) => {
    setTimeLimit(newLimit)
    setTimeLeft(newLimit)
    resetGame()
  }

  const handleNameChange = (value: string) => {
    setNickname(value)
    localStorage.setItem(NAME_KEY, value.trim())
    setHasSaved(false)
  }

  const handleSaveSession = async () => {
    if (!nickname.trim()) return
    setIsSaving(true)
    try {
      const result = await saveGameSession({
        name: nickname,
        duration: timeLimit,
        wpm,
        accuracy,
        errors,
      })
      if (result.success) {
        setHasSaved(true)
        localStorage.setItem(NAME_KEY, nickname.trim())
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const timeOptions = [15, 30, 60]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-card border-2 border-foreground shadow-brutal-lg p-6 md:p-10 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="border-2 border-foreground bg-card p-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-foreground">TypeMaster</h1>
              {nickname && (
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Player: {nickname}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="border-2 border-foreground bg-foreground text-background px-4 py-1.5 text-center shadow-brutal">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Timer</p>
              <p className="text-3xl font-black font-mono leading-none">{String(timeLeft).padStart(2, "0")}</p>
            </div>
            <div className="flex gap-2">
              {timeOptions.map((opt) => (
                <Button
                  key={opt}
                  onClick={() => changeTimeLimit(opt)}
                  className={`border-2 border-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all ${
                    timeLimit === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt}s
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Display */}
        <div className="bg-secondary border-2 border-foreground p-6 md:p-8 max-h-[220px] relative overflow-hidden">
          <div
            className="text-2xl md:text-3xl font-mono leading-relaxed text-balance transition-all duration-300 ease-out"
            style={{ transform: `translateY(-${Math.floor(currentIndex / 50) * 3}rem)` }}
          >
            {sampleText.split("").map((char, idx) => (
              <span
                key={idx}
                className={`relative ${
                  idx < currentIndex
                    ? "text-primary font-bold"
                    : idx === currentIndex && errorFlash
                      ? "text-destructive-foreground bg-destructive"
                      : "text-muted-foreground/50"
                }`}
              >
                {idx === currentIndex && !isFinished && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary blink" />
                )}
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3 flex-wrap">
          <Button
            onClick={resetGame}
            className="gap-2 border-2 border-foreground bg-card text-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-secondary transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </Button>
          {isFinished && !showResults && (
            <Button
              onClick={() => setShowResults(true)}
              className="gap-2 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              View Results
            </Button>
          )}
        </div>

        {/* Visual Keyboard */}
        <div className="bg-foreground border-2 border-foreground p-4 md:p-6">
          <div className="flex flex-col gap-2.5">
            {KEYBOARD_LAYOUT.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-2 md:gap-2.5">
                {row.map((key) => {
                  const isPressed = pressedKey === key
                  const isError = isPressed && errorFlash
                  return (
                    <div
                      key={key}
                      className={`w-10 h-11 md:w-14 md:h-14 flex items-center justify-center border-2 font-mono text-base md:text-lg font-black transition-all duration-75 ${
                        isPressed
                          ? `translate-x-0.5 translate-y-0.5 border-background ${
                              isError
                                ? "bg-destructive text-destructive-foreground"
                                : "bg-primary text-primary-foreground"
                            }`
                          : "bg-card text-foreground border-background shadow-[3px_3px_0_0_var(--primary)]"
                      }`}
                    >
                      {key.toUpperCase()}
                    </div>
                  )
                })}
              </div>
            ))}
            <div className="flex justify-center pt-1">
              <div
                className={`w-80 md:w-96 h-11 md:h-14 flex items-center justify-center border-2 font-mono text-xs font-black uppercase tracking-widest transition-all duration-75 ${
                  pressedKey === "Space"
                    ? `translate-x-0.5 translate-y-0.5 border-background ${
                        errorFlash
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-primary text-primary-foreground"
                      }`
                    : "bg-card text-foreground border-background"
                }`}
              >
                Space
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="border-2 border-foreground shadow-brutal-lg sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight">
              Test Complete
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-4">
            {[
              { label: "WPM", value: wpm },
              { label: "Accuracy", value: `${accuracy}%` },
              { label: "Errors", value: errors },
            ].map((stat) => (
              <div key={stat.label} className="border-2 border-foreground bg-secondary p-3 text-center shadow-brutal">
                <p className="text-3xl font-black text-primary font-mono">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center justify-between border-2 border-foreground bg-card px-4 py-3 shadow-brutal">
              {editingName ? (
                <Input
                  autoFocus
                  value={nickname}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  placeholder="Your name"
                  maxLength={20}
                  className="h-8 border-0 p-0 text-lg font-black focus-visible:ring-0"
                />
              ) : (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saving as</p>
                  <p className="text-lg font-black text-foreground">{nickname || "Anonymous"}</p>
                </div>
              )}
              <button
                onClick={() => setEditingName((v) => !v)}
                className="border-2 border-foreground bg-secondary p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Edit name"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSession}
                disabled={isSaving || hasSaved || !nickname.trim()}
                className="flex-1 border-2 border-foreground bg-foreground text-background font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : hasSaved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  "Save Score"
                )}
              </Button>
              <Button
                onClick={resetGame}
                className="flex-1 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
