"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, LogIn, Gamepad2, Target, Trophy, Medal, Keyboard } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import { APP_VERSION } from "@/lib/constants"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { getUserResults, getUserRank } from "./actions"

interface HeroStats {
  tests: number
  bestWpm: number | null
  avgAccuracy: number | null
  rank: number | null
}

const statTile =
  "border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1.5"

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<HeroStats | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([getUserResults(), getUserRank()])
      .then(([results, rank]) => {
        if (cancelled) return
        const history = results.history
        const tests = history.length
        const avgAccuracy =
          tests > 0 ? Math.round((history.reduce((sum, g) => sum + g.accuracy, 0) / tests) * 10) / 10 : null
        setStats({
          tests,
          bestWpm: results.best?.wpm ?? null,
          avgAccuracy,
          rank: rank?.rank ?? null,
        })
      })
      .catch(() => {
        if (!cancelled) setStats(null)
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const startGame = () => {
    router.push("/game")
  }

  const handleSignIn = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Main */}
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto w-full">
          {/* Hero */}
          <section className="border-b-2 border-foreground">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-16 lg:py-20 flex flex-col gap-8 sm:gap-10">
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
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-foreground leading-[1.3] sm:leading-[1.35] lg:leading-[1.25] break-words text-balance">
                  Master Your{" "}
                  <span className="bg-primary text-primary-foreground px-2 sm:px-3 box-decoration-clone">
                    Typing
                  </span>{" "}
                  Speed
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed text-pretty">
                  Push your typing speed to the limit. Track every keystroke, crush your accuracy, and climb the global leaderboard.
                </p>
              </div>

              {/* Stats (authenticated) or Sign-in prompt (guests) */}
              <div className="flex flex-col gap-3">
                {user ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className={statTile}>
                        <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-2xl font-black font-mono leading-none text-primary tabular-nums">
                          {stats?.tests ?? "-"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Tests
                        </span>
                      </div>
                      <div className={statTile}>
                        <Trophy className="w-4 h-4 text-muted-foreground" />
                        <span className="text-2xl font-black font-mono leading-none text-primary tabular-nums">
                          {stats?.bestWpm ?? "-"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Best WPM
                        </span>
                      </div>
                      <div className={statTile}>
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-2xl font-black font-mono leading-none text-primary tabular-nums">
                          {stats?.avgAccuracy != null ? `${stats.avgAccuracy}%` : "-"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Avg Accuracy
                        </span>
                      </div>
                      <div className={statTile}>
                        <Medal className="w-4 h-4 text-muted-foreground" />
                        <span className="text-2xl font-black font-mono leading-none text-primary tabular-nums">
                          {stats?.rank != null ? `#${stats.rank}` : "-"}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Rank
                        </span>
                      </div>
                    </div>
                ) : (
                  <div className="border-2 border-foreground bg-card p-4 sm:p-6 shadow-brutal flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        Sign in to save scores and track progress
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Guest scores are saved locally in your browser.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSignIn("google")}
                        className="inline-flex items-center gap-1.5 border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Google
                      </button>
                      <button
                        onClick={() => handleSignIn("github")}
                        className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        GitHub
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                onClick={startGame}
                className="w-full sm:w-auto h-auto border-2 border-foreground bg-primary text-primary-foreground text-sm sm:text-base font-black uppercase tracking-wide px-6 sm:px-8 py-3 sm:py-4 shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal transition-brutal"
              >
                Start Typing Test
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </section>

          {/* How It Works */}
          <section aria-label="How it works">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-14 border-b-2 border-foreground">
              <div className="flex flex-col gap-6 sm:gap-8">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-foreground bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Guide
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground text-balance">
                    How It Works
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      icon: <Gamepad2 className="w-5 h-5" />,
                      step: "01",
                      title: "Play",
                      body: "Pick a time limit and text mode, then hit the typing area.",
                    },
                    {
                      icon: <Keyboard className="w-5 h-5" />,
                      step: "02",
                      title: "Type",
                      body: "The timer starts on your first keystroke. Speed and accuracy count.",
                    },
                    {
                      icon: <Trophy className="w-5 h-5" />,
                      step: "03",
                      title: "Track",
                      body: "Save your score, unlock certificates, and climb the leaderboard.",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="border-2 border-foreground bg-card p-4 sm:p-5 shadow-brutal flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="bg-primary text-primary-foreground border-2 border-foreground p-2">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {item.step}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-lg font-black uppercase tracking-tight text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
    </div>
  )
}