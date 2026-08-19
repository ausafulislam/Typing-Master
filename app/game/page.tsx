"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, BarChart3, Loader2, Check, ArrowLeft, Pencil, Volume2, VolumeX, Trophy, Keyboard } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { saveGameSession, checkNameExists, awardCertificates } from "../actions"
import { playKeySound } from "@/lib/key-sound"

const NAME_KEY = "typing-game-nickname"
const SOUND_KEY = "typing-game-sound"
const CHARS_PER_LINE = 50
const LINE_HEIGHT_REM = 3.4
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
const NAME_SUFFIXES = ["Pro", "Speed", "Ninja", "Turbo", "Ace", "X", "Master", "Go", "God", "Elite", "Blitz", "Rapid"]

function generateSuggestions(name: string): string[] {
  const shuffled = [...NAME_SUFFIXES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((suffix) => `${name}-${suffix}`)
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage full or sandboxed — silently ignore
  }
}

export default function TypingGame() {
  const [sampleText, setSampleText] = useState("")
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
  const [nickname, setNickname] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState<boolean | null>(null)
  const [textMode, setTextMode] = useState<TextMode>("normal")
  const [nameError, setNameError] = useState(false)
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([])
  const [checkingName, setCheckingName] = useState(false)
  const [newCertificates, setNewCertificates] = useState<{ tier: string; id: string }[]>([])
  const nameDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const soundOnRef = useRef(true)
  const isFinishedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const currentIndexRef = useRef(0)
  const sampleTextRef = useRef("")
  const isActiveRef = useRef(false)

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const resetGame = useCallback(() => {
    clearTimeouts()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const texts = SAMPLE_TEXTS[textMode]
    const randomText = texts[Math.floor(Math.random() * texts.length)]
    setSampleText(randomText)
    sampleTextRef.current = randomText
    setCurrentIndex(0)
    currentIndexRef.current = 0
    setTimeLeft(timeLimit)
    setIsActive(false)
    isActiveRef.current = false
    setIsFinished(false)
    isFinishedRef.current = false
    setErrors(0)
    setTotalTyped(0)
    setPressedKey(null)
    setErrorFlash(false)
    setShowResults(false)
    setHasSaved(false)
    setSaveFeedback(null)
  }, [timeLimit, textMode, clearTimeouts])

  useEffect(() => {
    const storedNickname = safeLocalStorageGet(NAME_KEY)
    if (storedNickname) setNickname(storedNickname)
    const storedSound = safeLocalStorageGet(SOUND_KEY)
    if (storedSound === "off") {
      setSoundOn(false)
      soundOnRef.current = false
    }
  }, [])

  useEffect(() => {
    setIsTouchDevice(window.matchMedia("(hover: none) and (pointer: coarse)").matches)
  }, [])

  useEffect(() => {
    resetGame()
  }, [resetGame])

  // Timer effect — ref-based, only depends on isActive
  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          timerRef.current = null
          isFinishedRef.current = true
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive])

  // Handle game end separately from timer to avoid side effects in state updater
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      setIsActive(false)
      isActiveRef.current = false
      setIsFinished(true)
      setShowResults(true)
    }
  }, [timeLeft, isActive])

  // Handle key press — uses refs for values that change between renders
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (isFinishedRef.current || currentIndexRef.current >= sampleTextRef.current.length) return

      const key = e.key
      if (key.length > 1 && key !== " ") return

      if (key === " ") e.preventDefault()

      if (!isActiveRef.current) {
        setIsActive(true)
        isActiveRef.current = true
      }

      setPressedKey(key === " " ? "Space" : key.toLowerCase())
      const pressTimeout = setTimeout(() => setPressedKey(null), 150)
      timeoutsRef.current.push(pressTimeout)

      if (!prefersReducedMotion()) {
        // nothing — flash state still updates for accessibility
      }

      const expectedChar = sampleTextRef.current[currentIndexRef.current]
      setTotalTyped((prev) => prev + 1)

      if (key === expectedChar) {
        if (soundOnRef.current) playKeySound(key === " " ? "space" : "key")
        const newIndex = currentIndexRef.current + 1
        setCurrentIndex(newIndex)
        currentIndexRef.current = newIndex
      } else {
        if (soundOnRef.current) playKeySound("error")
        setErrors((prev) => prev + 1)
        setErrorFlash(true)
        const errorTimeout = setTimeout(() => setErrorFlash(false), 150)
        timeoutsRef.current.push(errorTimeout)
      }
    },
    [],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress)
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
      clearTimeouts()
    }
  }, [handleKeyPress, clearTimeouts])

  // Pause timer when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && isActiveRef.current) {
        // Browsers throttle intervals in background tabs.
        // We let the interval keep running but the timer may drift.
        // For a game this is acceptable — the user shouldn't tab away mid-game.
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [])

  const elapsed = timeLimit - timeLeft
  const wpm = elapsed > 0 ? Math.round(currentIndex / 5 / (elapsed / 60)) : 0
  const displayWpm = elapsed < WPM_STABILITY_THRESHOLD && wpm > 0 ? 0 : wpm
  const accuracy = totalTyped > 0 ? Math.round((((totalTyped - errors) / totalTyped) * 100) * 10) / 10 : 100
  const progress = sampleText.length > 0 ? Math.round((currentIndex / sampleText.length) * 100) : 0

  const changeTimeLimit = (newLimit: number) => {
    if (showResults) return
    setTimeLimit(newLimit)
    setTimeLeft(newLimit)
    resetGame()
  }

  const changeTextMode = (newMode: TextMode) => {
    if (showResults) return
    setTextMode(newMode)
  }

  const toggleSound = () => {
    setSoundOn((prev) => {
      const next = !prev
      soundOnRef.current = next
      safeLocalStorageSet(SOUND_KEY, next ? "on" : "off")
      if (next) playKeySound("key")
      return next
    })
  }

  const handleNameChange = (value: string) => {
    setNickname(value)
    setHasSaved(false)
    setSaveFeedback(null)
    setNameError(false)
    setNameSuggestions([])
    if (nameDebounceTimer.current) clearTimeout(nameDebounceTimer.current)
    const trimmed = value.trim()
    if (!trimmed || trimmed.length < 2) {
      setCheckingName(false)
      return
    }
    setCheckingName(true)
    nameDebounceTimer.current = setTimeout(() => {
      checkNameExists(trimmed).then((exists) => {
        setNameError(exists)
        setNameSuggestions(exists ? generateSuggestions(trimmed) : [])
        setCheckingName(false)
      })
    }, 400)
  }

  const checkCurrentName = useCallback(() => {
    const trimmed = nickname.trim()
    if (!trimmed || trimmed.length < 2) {
      setNameError(false)
      setNameSuggestions([])
      return
    }
    setCheckingName(true)
    checkNameExists(trimmed).then((exists) => {
      setNameError(exists)
      setNameSuggestions(exists ? generateSuggestions(trimmed) : [])
      setCheckingName(false)
    })
  }, [nickname])

  const persistName = () => {
    if (nickname.trim()) {
      safeLocalStorageSet(NAME_KEY, nickname.trim())
    }
  }

  const handleSaveSession = async () => {
    if (!nickname.trim()) return
    setIsSaving(true)
    setSaveFeedback(null)
    setNewCertificates([])
    try {
      const result = await saveGameSession({ name: nickname, duration: timeLimit, wpm: displayWpm, accuracy, errors, textMode })
      if (result.success) {
        if (result.saved) {
          setHasSaved(true)
          safeLocalStorageSet(NAME_KEY, nickname.trim())
          const certs = await awardCertificates(nickname.trim(), displayWpm, accuracy)
          if (certs.length > 0) {
            setNewCertificates(certs)
          }
        } else {
          setSaveFeedback("Your best score is higher — this run wasn't saved.")
        }
      } else {
        setSaveFeedback(result.error || "Failed to save score. Please try again.")
      }
    } catch (error) {
      console.error("Failed to save:", error)
      setSaveFeedback("Failed to save score. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isTouchDevice === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="border-2 border-foreground bg-card px-6 py-4 shadow-brutal text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isTouchDevice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
          <div className="bg-foreground text-background p-3">
            <Keyboard className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Keyboard Required</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              TypeMaster is a keyboard-only typing game and can&apos;t be played on touch devices. Open it on a
              computer with a physical keyboard to start typing.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  const liveStats = [
    { label: "WPM", value: displayWpm },
    { label: "Accuracy", value: `${accuracy}%` },
    { label: "Errors", value: errors },
    { label: "Progress", value: `${progress}%` },
  ]

  return (
    <div id="main-content" className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl bg-card border-2 border-foreground shadow-brutal-lg p-5 sm:p-8 lg:p-10 flex flex-col gap-6 sm:gap-8">
        {/* Header */}
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="border-2 border-foreground bg-card p-2.5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
                aria-label="Back to home"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none text-foreground">
                  TypeMaster
                </h1>
                {nickname && (
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary leading-none">
                    Player: {nickname}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
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
                <p className="text-3xl font-black font-mono leading-none tabular-nums">
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
        </header>

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
        <div className="bg-secondary border-2 border-foreground p-6 sm:p-8 h-[200px] sm:h-[220px] relative overflow-hidden">
          <div
            className="text-[1.6rem] sm:text-3xl font-mono leading-[1.9] tracking-wide transition-transform duration-300 ease-out"
            style={{ transform: `translateY(-${Math.floor(currentIndex / CHARS_PER_LINE) * LINE_HEIGHT_REM}rem)` }}
          >
            {sampleText.split("").map((char, idx) => (
              <span
                key={idx}
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
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span className="border-2 border-foreground bg-card px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] shadow-brutal">
                Start typing to begin
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary border-2 border-foreground overflow-hidden">
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
            onClick={resetGame}
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

        {/* Visual Keyboard */}
        <div className="bg-foreground border-2 border-foreground p-4 sm:p-6">
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

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3 border-2 border-foreground bg-card px-4 py-3 shadow-brutal">
                {editingName ? (
                  <Input
                    autoFocus
                    value={nickname}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onBlur={() => { setEditingName(false); persistName(); checkCurrentName() }}
                    placeholder="Your name"
                    aria-label="Your name"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={20}
                    className={`h-8 border-0 p-0 text-lg font-black ${
                      nameError ? "text-destructive" : ""
                    }`}
                  />
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground leading-none">
                      Saving as
                    </p>
                    <p className="text-lg font-black text-foreground leading-none">{nickname || "Anonymous"}</p>
                  </div>
                )}
                <button
                  onClick={() => {
                    setEditingName((v) => !v)
                    if (!editingName) checkCurrentName()
                  }}
                  className="border-2 border-foreground bg-secondary p-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              {nameError && (
                <div className="flex flex-col gap-2 px-1">
                  <p className="text-xs font-bold text-blue-600">
                    This name has existing scores. Your best score will be updated.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground self-center">
                      Or try:
                    </span>
                    {nameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleNameChange(suggestion)}
                        className="border-2 border-foreground bg-secondary px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {saveFeedback && (
              <p role="status" aria-live="polite" className="text-center text-xs font-bold uppercase tracking-widest text-destructive">
                {saveFeedback}
              </p>
            )}

            {newCertificates.length > 0 && (
              <div className="flex flex-col gap-2 border-2 border-foreground bg-secondary p-4 shadow-brutal">
                <p className="text-xs font-bold uppercase tracking-widest text-center text-primary">
                  New Certificate{newCertificates.length > 1 ? "s" : ""} Earned!
                </p>
                {newCertificates.map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                      {cert.tier}
                    </span>
                    <code className="text-xs font-mono font-bold text-primary">{cert.id}</code>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSaveSession}
                disabled={isSaving || hasSaved || !nickname.trim()}
                className="flex-1 h-11 border-2 border-foreground bg-foreground text-background font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal disabled:opacity-60"
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
