"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart3, Loader2, Check, Volume2, VolumeX, Trophy } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { saveTypedResult } from "../actions"
import { playKeySound } from "@/lib/key-sound"
import { calculateAccuracy, calculateProgress, calculateWpm } from "@/lib/wpm"
import { useLocalStorageState } from "@/hooks/use-local-storage-state"

const SOUND_KEY = "typing-game-sound"
const LOCAL_SCORES_KEY = "tmx-unsynced-scores"
const WPM_STABILITY_THRESHOLD = 5

const SAMPLE_TEXTS = {
  normal: [
    "the quick brown fox jumps over the lazy dog while the moon shines bright in the darkening sky above the hills where ancient trees stand tall and proud among the whispering winds that carry tales of old adventures and forgotten dreams across the vast expanse of time and space",
    "in the heart of the forest where shadows dance between towering oaks and pines there lives a community of creatures both large and small who work together to maintain the delicate balance of nature through seasons of change and growth where every leaf and branch tells a story of survival",
    "technology advances at an incredible pace bringing new innovations and discoveries that reshape our world and challenge our understanding of what is possible as we venture into uncharted territories of science and exploration seeking answers to questions that have puzzled humanity for generations",
    "music flows through the air like liquid gold touching hearts and souls with melodies that transcend language and culture bringing people together in moments of pure joy and celebration where rhythm and harmony create a universal language that speaks to the deepest parts of our experience",
    "the ocean waves crash against the rocky shore in an eternal dance of power and grace where countless mysteries lie hidden beneath the surface waiting to be discovered by brave explorers who dare to venture into the depths where light fades and pressure builds creating an alien world",
  ],
  numbers: [
    "the quick 42 brown fox jumps over 7 lazy dogs while 15 moons shine bright above 3 ancient hills where 100 tall trees stand proud among 25 whispering winds that carry 50 tales of old adventures and forgotten dreams across the vast expanse",
    "in the year 2024 there are 8 billion people on earth and 5 billion use technology every day to connect with 10 million communities across 195 countries around the world where 300 languages are spoken by 7 different continents",
    "the average typing speed is 40 words per minute but professional typists can reach 75 to 90 words per minute with 99 percent accuracy after practicing for 300 hours over 6 months of dedicated training sessions",
    "a computer keyboard has 104 keys including 26 letter keys 10 number keys 11 function keys and various modifier keys that allow users to input over 200 different characters and commands into the system",
    "the fastest typing speed ever recorded was 216 words per minute by a stenographer who trained for 10 years and could process 3600 keystrokes per hour with remarkable precision and minimal errors",
  ],
  punctuation: [
    "the quick, brown fox jumps over the lazy dog! but wait, there's more to discover in this beautiful world; the moon shines bright, and the stars twinkle above us. isn't nature amazing?",
    "hello! how are you doing today? i hope you're having a great time. the weather is nice, isn't it? yes, it really is beautiful outside right now; the sun is warm and the breeze is cool.",
    "to learn programming, you need: patience, practice, and persistence. it's not easy, but it's worth it! the journey of a thousand miles begins with a single step; so start coding today.",
    "the book was amazing! it had everything: adventure, mystery, and romance. the author's writing style was incredible; every sentence was a masterpiece. i couldn't put it down until i finished it.",
    "life is what happens when you're busy making other plans. the only way to do great work is to love what you do. if you haven't found it yet, keep looking; don't settle. as with all matters of the heart, you'll know when you find it.",
  ],
  quotes: [
    "to be or not to be that is the question whether tis nobler in the mind to suffer the slings and arrows of outrageous fortune or to take arms against a sea of troubles and by opposing end them",
    "the only way to do great work is to love what you do if you have not found it yet keep looking do not settle as with all matters of the heart you will know when you find it steve jobs",
    "in three words i can sum up everything ive learned about life it goes on whether you think you can or you think you cant youre right henry ford",
    "the greatest glory in living lies not in never falling but in rising every time we fall the way to get started is to quit talking and begin doing nelson mandela",
    "life is what happens when youre busy making other plans live each day as if your last someday youll be right john lennon",
  ],
} as const

type TextMode = keyof typeof SAMPLE_TEXTS

interface LocalScore {
  wpm: number
  accuracy: number
  errors: number
  duration: number
  textMode: string
  createdAt: string
}

const INITIAL_TEXT = SAMPLE_TEXTS.normal[0]

const KEYBOARD_LAYOUT = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["z", "x", "c", "v", "b", "n", "m"],
]

const TIME_OPTIONS = [15, 30, 60]
const TEXT_MODE_OPTIONS: { value: TextMode; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "numbers", label: "Numbers" },
  { value: "punctuation", label: "Punct" },
  { value: "quotes", label: "Quotes" },
]

export default function TypingGame() {
  const { user, loading: authLoading } = useAuth()

  const [sampleText, setSampleText] = useState<string>(INITIAL_TEXT)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLimit, setTimeLimit] = useState(30)
  const [timeLeft, setTimeLeft] = useState(30)
  const [isActive, setIsActive] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [errors, setErrors] = useState(0)
  const [totalTyped, setTotalTyped] = useState(0)
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  const [errorFlash, setErrorFlash] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [soundPref, setSoundPref] = useLocalStorageState(SOUND_KEY, "on")
  const soundOn = soundPref !== "off"
  const [textMode, setTextMode] = useState<TextMode>("normal")
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [liveWpm, setLiveWpm] = useState(0)
  const [finalWpm, setFinalWpm] = useState<number | null>(null)
  const [finalElapsed, setFinalElapsed] = useState(0)

  const isFinishedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const currentIndexRef = useRef(0)
  const sampleTextRef = useRef<string>(INITIAL_TEXT)
  const isActiveRef = useRef(false)
  const startedAtRef = useRef<number | null>(null)
  const timeLimitRef = useRef(timeLimit)
  const errorsRef = useRef(0)
  const totalTypedRef = useRef(0)
  const caretElRef = useRef<HTMLSpanElement | null>(null)
  const textWrapperRef = useRef<HTMLDivElement | null>(null)
  const hiddenInputRef = useRef<HTMLInputElement | null>(null)

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const finishGame = useCallback(() => {
    if (isFinishedRef.current) return
    isFinishedRef.current = true
    isActiveRef.current = false
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const limit = timeLimitRef.current
    const elapsed = startedAtRef.current !== null ? Math.min((Date.now() - startedAtRef.current) / 1000, limit) : 0
    setFinalElapsed(Math.max(1, Math.round(elapsed)))
    setFinalWpm(calculateWpm(currentIndexRef.current, elapsed))
    setIsActive(false)
    setIsFinished(true)
    setShowResults(true)
    hiddenInputRef.current?.blur()
  }, [])

  const resetGame = useCallback(
    (overrides?: { timeLimit?: number; textMode?: TextMode }) => {
      clearTimeouts()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      const mode = overrides?.textMode ?? textMode
      const texts = SAMPLE_TEXTS[mode]
      const randomText = texts[Math.floor(Math.random() * texts.length)]
      setSampleText(randomText)
      sampleTextRef.current = randomText
      setCurrentIndex(0)
      currentIndexRef.current = 0
      const limit = overrides?.timeLimit ?? timeLimit
      setTimeLeft(limit)
      timeLimitRef.current = limit
    setIsActive(false)
    isActiveRef.current = false
    startedAtRef.current = null
    setIsFinished(false)
    isFinishedRef.current = false
    setFinalWpm(null)
    setFinalElapsed(0)
    setLiveWpm(0)
    setErrors(0)
    errorsRef.current = 0
    setTotalTyped(0)
    totalTypedRef.current = 0
    setPressedKey(null)
    setErrorFlash(false)
    setShowResults(false)
    setHasSaved(false)
    setSaveFeedback(null)
    setScrollY(0)
    caretElRef.current = null
    },
    [timeLimit, textMode, clearTimeouts],
  )

  useEffect(() => {
    if (!isActive) return

    const tick = () => {
      if (startedAtRef.current === null) return
      const elapsed = (Date.now() - startedAtRef.current) / 1000
      const remaining = timeLimitRef.current - elapsed
      if (remaining <= 0) {
        setTimeLeft(0)
        finishGame()
      } else {
        setTimeLeft(Math.ceil(remaining))
        setLiveWpm(
          elapsed < WPM_STABILITY_THRESHOLD ? 0 : calculateWpm(currentIndexRef.current, elapsed),
        )
      }
    }

    tick()
    timerRef.current = setInterval(tick, 250)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive, finishGame])

  useEffect(() => {
    const el = caretElRef.current
    const wrapper = textWrapperRef.current
    if (!el || !wrapper) {
      setScrollY(0)
      return
    }
    const style = getComputedStyle(wrapper)
    const lineHeight =
      parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.9 || 54
    setScrollY(Math.max(0, el.offsetTop - lineHeight))
  }, [currentIndex, sampleText])

  const processChar = useCallback(
    (key: string) => {
      if (isFinishedRef.current || currentIndexRef.current >= sampleTextRef.current.length) return

      if (!isActiveRef.current) {
        isActiveRef.current = true
        startedAtRef.current = Date.now()
        setIsActive(true)
      }

      setPressedKey(key === " " ? "Space" : key.toLowerCase())
      const pressTimeout = setTimeout(() => setPressedKey(null), 150)
      timeoutsRef.current.push(pressTimeout)

      const expectedChar = sampleTextRef.current[currentIndexRef.current]
      totalTypedRef.current += 1
      setTotalTyped(totalTypedRef.current)

      if (key === expectedChar) {
        if (soundOn) playKeySound(key === " " ? "space" : "key")
        const newIndex = currentIndexRef.current + 1
        setCurrentIndex(newIndex)
        currentIndexRef.current = newIndex
        if (newIndex >= sampleTextRef.current.length) {
          finishGame()
        }
      } else {
        if (soundOn) playKeySound("error")
        errorsRef.current += 1
        setErrors(errorsRef.current)
        setErrorFlash(true)
        const errorTimeout = setTimeout(() => setErrorFlash(false), 150)
        timeoutsRef.current.push(errorTimeout)
      }
    },
    [finishGame, soundOn],
  )

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (isFinishedRef.current || currentIndexRef.current >= sampleTextRef.current.length) return

      const target = e.target as HTMLElement | null
      if (target && target.closest("input, textarea, select, [contenteditable=true]")) return

      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return

      const key = e.key
      if (key.length > 1 && key !== " ") return

      const isInteractiveTarget = Boolean(target?.closest('button, a[href], [role="button"]'))
      // Space/Enter on a focused button must only activate the button — never
      // also type into the test.
      if (isInteractiveTarget && (key === " " || key === "Enter")) return
      if (key === " " && !isInteractiveTarget) e.preventDefault()

      processChar(key)
    },
    [processChar],
  )

  const handleTypingKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
      const key = e.key
      if (key.length > 1 && key !== " ") return
      e.preventDefault()
      processChar(key)
    },
    [processChar],
  )

  const handleTypingInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const el = e.currentTarget
      const text = el.value
      el.value = ""
      if (!text) return
      for (const ch of text) {
        if (isFinishedRef.current || currentIndexRef.current >= sampleTextRef.current.length) break
        processChar(ch)
      }
    },
    [processChar],
  )

  const focusTypingArea = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      clearTimeouts()
    }
  }, [handleKeyPress, clearTimeouts])

  const displayWpm = isFinished ? finalWpm ?? 0 : liveWpm
  const accuracy = calculateAccuracy(totalTyped, errors)
  const progress = calculateProgress(currentIndex, sampleText.length)

  const changeTimeLimit = (newLimit: number) => {
    if (showResults) return
    setTimeLimit(newLimit)
    resetGame({ timeLimit: newLimit })
  }

  const changeTextMode = (newMode: TextMode) => {
    if (showResults) return
    setTextMode(newMode)
    resetGame({ textMode: newMode })
  }

  const handleSignIn = async (provider: "google" | "github") => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        // Return to the game page after the OAuth round trip so the player
        // lands back where they were.
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/game")}`,
      },
    })
  }

  const toggleSound = () => {
    const next = !soundOn
    setSoundPref(next ? "on" : "off")
    if (next) playKeySound("key")
  }

  const handleSaveSession = async () => {
    setIsSaving(true)
    setSaveFeedback(null)
    try {
      const wpmToSave = finalWpm ?? displayWpm
      if (user) {
        const result = await saveTypedResult({
          wpm: wpmToSave,
          accuracy,
          errors,
          duration: timeLimit,
          textMode,
        })
        if (result.success) {
          setHasSaved(true)
          setSaveFeedback("Saved to your account")
        } else {
          setSaveFeedback(result.error ?? "Failed to save score. Please try again.")
        }
      } else {
        const existing = localStorage.getItem(LOCAL_SCORES_KEY)
        let scores: LocalScore[] = []
        if (existing) {
          try {
            const parsed: unknown = JSON.parse(existing)
            if (Array.isArray(parsed)) scores = parsed as LocalScore[]
          } catch {
            // Corrupt data — start fresh rather than losing this save.
            scores = []
          }
        }
        scores.push({
          wpm: wpmToSave,
          accuracy,
          errors,
          duration: timeLimit,
          textMode,
          createdAt: new Date().toISOString(),
        })
        // Keep only the most recent 50 — matches the server sync limit.
        if (scores.length > 50) scores = scores.slice(-50)
        localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores))
        setHasSaved(true)
        setSaveFeedback("Saved locally")
      }
    } catch (error) {
      console.error("Failed to save:", error)
      setSaveFeedback("Failed to save score. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const displayName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "Guest"

  const liveStats = [
    { label: "WPM", value: displayWpm },
    { label: "Accuracy", value: `${accuracy}%` },
    { label: "Errors", value: errors },
    { label: "Progress", value: `${progress}%` },
  ]

  return (
    <div id="main-content" className="min-h-screen bg-background flex flex-col">
      <div className="game-content flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl bg-card border-2 border-foreground shadow-brutal-lg p-5 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">
          {/* Header row: player + timer + sound */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none">
                Player
              </span>
              <p className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground truncate">
                {displayName}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleSound}
                aria-label={soundOn ? "Mute keyboard sound" : "Unmute keyboard sound"}
                aria-pressed={soundOn}
                className={`border-2 border-foreground p-2.5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal ${
                  soundOn ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                }`}
              >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <div className="border-2 border-foreground bg-foreground text-background px-4 py-2 text-center shadow-brutal">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 leading-none mb-1">Timer</p>
                <p
                  className="text-3xl font-black font-mono leading-none tabular-nums"
                  role="timer"
                  aria-label={`${timeLeft} seconds remaining`}
                >
                  {String(timeLeft).padStart(2, "0")}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-2">
              {TIME_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  onClick={() => changeTimeLimit(opt)}
                  disabled={showResults}
                  aria-pressed={timeLimit === opt}
                  className={`h-10 px-3.5 border-2 border-foreground font-black uppercase text-xs shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal disabled:opacity-40 ${
                    timeLimit === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {opt}s
                </Button>
              ))}
            </div>

            <div className="hidden sm:block w-px h-6 bg-foreground/20" />

            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {TEXT_MODE_OPTIONS.map((mode) => (
                <Button
                  key={mode.value}
                  onClick={() => changeTextMode(mode.value)}
                  disabled={showResults}
                  aria-pressed={textMode === mode.value}
                  className={`h-10 px-3 border-2 border-foreground font-black uppercase text-[10px] tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal disabled:opacity-40 ${
                    textMode === mode.value
                      ? "bg-foreground text-background"
                      : "bg-card text-foreground hover:bg-secondary"
                  }`}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {liveStats.map((stat) => (
              <div
                key={stat.label}
                className="border-2 border-foreground bg-secondary px-4 py-3 shadow-brutal flex flex-col gap-1.5"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none">
                  {stat.label}
                </p>
                <p className="text-2xl font-black font-mono text-foreground leading-none tabular-nums">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Text Display */}
          <div
            className="bg-secondary p-6 sm:p-8 h-[200px] sm:h-[220px] relative overflow-hidden cursor-text"
            onClick={focusTypingArea}
          >
            <div
              ref={textWrapperRef}
              className="relative text-[1.6rem] sm:text-3xl font-mono leading-[1.9] tracking-wide transition-transform duration-300 ease-out will-change-transform"
              style={{ transform: `translateY(-${scrollY}px)` }}
            >
              {sampleText.split("").map((char, idx) => (
                <span
                  key={idx}
                  ref={idx === currentIndex ? caretElRef : undefined}
                  className={`relative ${
                    idx < currentIndex
                      ? "text-primary font-bold"
                      : idx === currentIndex && errorFlash
                        ? "text-destructive-foreground bg-destructive"
                        : "text-muted-foreground/45"
                  }`}
                >
                  {idx === currentIndex && !isFinished && (
                    <span className="absolute -left-0.5 top-1 bottom-1 w-[3px] bg-primary blink" />
                  )}
                  {char}
                </span>
              ))}
            </div>
            {!isActive && !isFinished && currentIndex === 0 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none">
                <span className="bg-card px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <span className="hidden coarse:inline">Tap here to start typing</span>
                  <span className="coarse:hidden">Start typing to begin</span>
                </span>
              </div>
            )}
            <input
              ref={hiddenInputRef}
              type="text"
              aria-label="Typing input"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="text"
              className="absolute inset-0 w-full h-full opacity-0 text-base cursor-default"
              onKeyDown={handleTypingKeyDown}
              onInput={handleTypingInput}
            />
          </div>

          {/* Progress Bar — screenreader value comes from the percentage text */}
          <div className="flex items-center gap-3">
            <div
              className="flex-1 h-2 bg-secondary overflow-hidden"
              role="progressbar"
              aria-label="Test progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
            >
              <div
                className="h-full bg-primary transition-all duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-black font-mono tabular-nums text-muted-foreground w-10 text-right">
              {progress}%
            </span>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 flex-wrap">
            <Button
              onClick={() => resetGame()}
              className="h-11 gap-2 border-2 border-foreground bg-card text-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:bg-secondary transition-brutal"
            >
              <RotateCcw className="w-4 h-4" />
              Restart
            </Button>
            {isFinished && !showResults && (
              <Button
                onClick={() => setShowResults(true)}
                className="h-11 gap-2 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
              >
                <BarChart3 className="w-4 h-4" />
                View Results
              </Button>
            )}
          </div>

          {/* Visual Keyboard — decorative feedback for the current keystroke */}
          <div className="bg-foreground border-2 border-foreground p-4 sm:p-6" aria-hidden="true">
            <div className="flex flex-col gap-2 sm:gap-2.5">
              {KEYBOARD_LAYOUT.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1.5 sm:gap-2.5">
                  {row.map((key) => {
                    const isPressed = pressedKey === key
                    const isError = isPressed && errorFlash
                    return (
                      <div
                        key={key}
                        className={`w-[8.5vw] h-[8.5vw] max-w-14 max-h-14 sm:w-14 sm:h-14 flex items-center justify-center border-2 font-mono text-sm sm:text-lg font-black transition-brutal-fast ${
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
                  className={`w-2/3 max-w-96 h-11 sm:h-14 flex items-center justify-center border-2 font-mono text-[11px] font-black uppercase tracking-[0.3em] transition-brutal-fast ${
                    pressedKey === "Space"
                      ? `translate-x-0.5 translate-y-0.5 border-background ${
                          errorFlash
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-primary text-primary-foreground"
                        }`
                      : "bg-card text-foreground border-background shadow-[3px_3px_0_0_var(--primary)]"
                  }`}
                >
                  Space
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={(open) => { if (!open) setShowResults(false) }}>
        <DialogContent className="border-2 border-foreground shadow-brutal-lg sm:max-w-md gap-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-center text-2xl font-black uppercase tracking-tight">Test Complete</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "WPM", value: displayWpm },
              { label: "Accuracy", value: `${accuracy}%` },
              { label: "Errors", value: errors },
            ].map((stat) => (
              <div key={stat.label} className="border-2 border-foreground bg-secondary p-4 text-center shadow-brutal flex flex-col gap-2">
                <p className="text-3xl font-black text-primary font-mono leading-none tabular-nums">{stat.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Characters", value: totalTyped },
              { label: "Duration", value: `${finalElapsed}s` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="border-2 border-foreground bg-secondary px-4 py-3 shadow-brutal flex items-center justify-between gap-2"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </span>
                <span className="text-lg font-black font-mono tabular-nums">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSaveSession}
              disabled={isSaving || hasSaved || authLoading}
              className="w-full h-11 border-2 border-foreground bg-foreground text-background font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal disabled:opacity-60"
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
                user ? "Save Score" : "Save Locally"
              )}
            </Button>

            {!user && !authLoading && !hasSaved && (
              <div className="flex items-center justify-center gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Or
                </span>
                <button
                  onClick={() => handleSignIn("google")}
                  className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
                >
                  Sign in with Google
                </button>
                <button
                  onClick={() => handleSignIn("github")}
                  className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary transition-colors cursor-pointer underline underline-offset-4"
                >
                  Sign in with GitHub
                </button>
              </div>
            )}

            {saveFeedback && (
              <p role="status" aria-live="polite" className={`text-center text-xs font-bold uppercase tracking-widest ${hasSaved ? "text-primary" : "text-destructive"}`}>
                {saveFeedback}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => resetGame()}
                className="flex-1 h-11 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>

            {hasSaved && (
              <Link
                href="/"
                className="flex items-center justify-center gap-2 border-2 border-foreground bg-secondary px-4 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
              >
                <Trophy className="w-4 h-4" />
                View Leaderboard
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
