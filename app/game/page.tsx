"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart3, Loader2, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeSwitcher } from "@/components/theme-switcher"
import Link from "next/link"
import { saveGameSession } from "../actions"

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
    const storedNickname = localStorage.getItem("typing-game-nickname")
    if (storedNickname) {
      setNickname(storedNickname)
    }
    setHasSaved(false)
  }, [])

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNickname(value)
    localStorage.setItem("typing-game-nickname", value)
  }

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

      // Ignore modifier keys
      if (key.length > 1 && key !== " ") return

      // Start timer on first keypress
      if (!isActive) {
        setIsActive(true)
      }

      setPressedKey(key === " " ? "Space" : key.toLowerCase())
      setTimeout(() => setPressedKey(null), 200)

      const expectedChar = sampleText[currentIndex]
      setTotalTyped((prev) => prev + 1)

      if (key === expectedChar) {
        // Correct key
        setTypedChars((prev) => {
          const newTyped = [...prev]
          newTyped[currentIndex] = true
          return newTyped
        })
        setCurrentIndex((prev) => prev + 1)
      } else {
        // Wrong key
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

  const handleSaveSession = async () => {
    if (!nickname.trim()) return

    setIsSaving(true)
    try {
      const result = await saveGameSession({
        name: nickname,
        duration: timeLimit,
        wpm: wpm,
        accuracy: accuracy,
        errors: errors,
      })

      if (result.success) {
        setHasSaved(true)
        localStorage.setItem("typing-game-nickname", nickname.trim())
      }
    } catch (error) {
      console.error("Failed to save:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-6xl bg-card rounded-3xl shadow-2xl p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">TypeMaster</h1>
              <p className="text-sm text-primary font-medium">Practice Your Speed</p>
            </Link>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Timer</p>
            <p className="text-4xl font-bold text-muted-foreground">{String(timeLeft).padStart(2, "0")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeLimit === 15 ? "default" : "outline"}
              onClick={() => changeTimeLimit(15)}
              className={timeLimit === 15 ? "bg-primary text-primary-foreground" : ""}
            >
              15s
            </Button>
            <Button
              variant={timeLimit === 30 ? "default" : "outline"}
              onClick={() => changeTimeLimit(30)}
              className={timeLimit === 30 ? "bg-primary text-primary-foreground" : ""}
            >
              30s
            </Button>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Text Display */}
        <div className="bg-background/50 rounded-2xl p-8 max-h-[200px] relative overflow-hidden transition-colors duration-500">
          <div
            className="text-2xl md:text-3xl font-mono leading-relaxed text-balance transition-all duration-300 ease-out"
            style={{
              transform: `translateY(-${Math.floor(currentIndex / 50) * 3}rem)`,
            }}
          >
            {sampleText.split("").map((char, idx) => (
              <span
                key={idx}
                className={`
                  ${
                    idx < currentIndex
                      ? "text-primary"
                      : idx === currentIndex && errorFlash
                        ? "text-destructive bg-destructive/20"
                        : "text-muted-foreground/40"
                  } relative
                `}
              >
                {idx === currentIndex && !isFinished && (
                  <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary blink" />
                )}
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Stats or Reset */}
        <div className="flex justify-center gap-3">
          <Button onClick={resetGame} variant="outline" className="gap-2 bg-transparent">
            <RotateCcw className="w-4 h-4" />
            Start Over
          </Button>
          {isFinished && !showResults && (
            <Button onClick={() => setShowResults(true)} variant="default" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              View Results
            </Button>
          )}
        </div>

        {/* Visual Keyboard */}
        <div className="bg-black/40 p-6 rounded-3xl border border-white/10 shadow-2xl">
          <div className="space-y-3">
            {KEYBOARD_LAYOUT.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-center gap-3">
                {row.map((key) => {
                  const isPressed = pressedKey === key
                  const isError = isPressed && errorFlash

                  return (
                    <div
                      key={key}
                      className={`
                        w-12 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-xl font-mono text-lg font-bold transition-all duration-75
                        ${
                          isPressed
                            ? `translate-y-1.5 shadow-none ${
                                isError
                                  ? "bg-destructive text-destructive-foreground border-t-0"
                                  : "bg-primary text-primary-foreground border-t-0"
                              }`
                            : `bg-gray-100 text-gray-800 border-t border-white/50 shadow-[0_6px_0_#a3a3a3,0_12px_12px_-4px_rgba(0,0,0,0.3)]`
                        }
                      `}
                    >
                      {key.toUpperCase()}
                    </div>
                  )
                })}
              </div>
            ))}
            {/* Space bar */}
            <div className="flex justify-center pt-2">
              <div
                className={`
                  w-96 h-14 md:h-16 flex items-center justify-center rounded-xl font-mono text-sm font-bold transition-all duration-75
                  ${
                    pressedKey === "Space"
                      ? `translate-y-1.5 shadow-none ${
                          errorFlash
                            ? "bg-destructive text-destructive-foreground border-t-0"
                            : "bg-primary text-primary-foreground border-t-0"
                        }`
                      : `bg-gray-100 text-gray-800 border-t border-white/50 shadow-[0_6px_0_#a3a3a3,0_12px_12px_-4px_rgba(0,0,0,0.3)]`
                  }
                `}
              >
                SPACE
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog for results */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold text-primary">Test Complete!</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{wpm}</p>
              <p className="text-sm text-muted-foreground">WPM</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{errors}</p>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
          </div>

          <div className="space-y-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-muted-foreground">
                Your Nickname
              </Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={handleNicknameChange}
                placeholder="Enter your nickname"
                className="text-center font-medium text-lg"
                maxLength={20}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSession}
                disabled={isSaving || hasSaved || !nickname.trim()}
                className="flex-1"
                variant="secondary"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
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
              <Button onClick={resetGame} className="flex-1">
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
