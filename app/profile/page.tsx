"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Keyboard, Trophy, Medal, Gamepad2, Copy, Check, ExternalLink, LogIn, Lock, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"
import { getUserResults, getUserRank, getUserCertificates } from "../actions"
import { CERTIFICATE_TIERS } from "@/lib/constants"

interface PlayerStats {
  wpm: number
  accuracy: number
  rank: number
}

interface Certificate {
  id: string
  tier: string
  wpm: number
  accuracy: number
  created_at: string
}

interface GameEntry {
  id: number
  text_mode: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
  created_at: string
}

interface ProfileData {
  stats: PlayerStats | null
  certificates: Certificate[]
  history: GameEntry[]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()
  const [data, setData] = useState<ProfileData | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    Promise.all([
      getUserResults(),
      getUserRank(),
      getUserCertificates(),
    ]).then(([results, rank, certs]) => {
      if (!cancelled) {
        setData({
          stats: rank ? { wpm: results.best?.wpm ?? 0, accuracy: results.best?.accuracy ?? 0, rank: rank.rank } : null,
          certificates: certs,
          history: results.history,
        })
      }
    })
    return () => { cancelled = true }
  }, [user])

  const loading = user !== null && data === null
  const stats = data?.stats ?? null
  const certificates = data?.certificates ?? []
  const history = data?.history ?? []

  const copyId = (id: string) => {
    try {
      navigator.clipboard.writeText(id)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard unavailable (insecure context) — silently ignore
    }
  }

  const totalGames = history.length
  const avgAccuracy = totalGames > 0 ? Math.round(history.reduce((s, g) => s + g.accuracy, 0) / totalGames * 10) / 10 : 0

  const handleSignIn = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profile")}` },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  // Not authenticated — show sign-in prompt
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
          <div className="bg-foreground text-background p-3">
            <Keyboard className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Sign In Required</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Sign in with Google or GitHub to view your profile, stats, and certificates.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSignIn("google")}
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Google
            </button>
            <button
              onClick={() => handleSignIn("github")}
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              GitHub
            </button>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border-2 border-foreground bg-secondary text-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-foreground bg-secondary text-foreground w-fit px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 border-2 border-foreground bg-card text-foreground w-fit px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none hover:text-destructive transition-brutal cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>

          {/* Player Name */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground break-words text-balance">
              {user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email ?? "User"}
            </h2>
          </div>

          {loading ? (
            <div className="border-2 border-foreground bg-card px-6 py-4 shadow-brutal text-center" role="status">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading profile…</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">{totalGames}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tests</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">
                    {stats?.wpm ?? "-"}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best WPM</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Medal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">{avgAccuracy || "-"}%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Accuracy</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">#{stats?.rank ?? "-"}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rank</span>
                </div>
              </div>

              {/* Certificates — blur overlay when not authenticated */}
              <div className="flex flex-col gap-4 relative">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-foreground bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Certs
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                    Certificates
                  </h3>
                </div>

                <div className={`${user ? "" : "blur-sm pointer-events-none select-none"}`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CERTIFICATE_TIERS.map((tier) => {
                      const earned = certificates.find((c) => c.tier === tier.name)
                      return (
                        <div
                          key={tier.name}
                          className={`border-2 border-foreground p-4 shadow-brutal flex flex-col gap-3 ${
                            earned ? "bg-card" : "bg-secondary opacity-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 border-2 border-foreground"
                                style={{ backgroundColor: tier.color }}
                              />
                              <span className="text-sm font-black uppercase tracking-widest">{tier.label}</span>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {tier.minWpm}+ WPM
                            </span>
                          </div>
                          {earned ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <code className="flex-1 min-w-0 text-xs font-mono font-bold text-primary break-all">{earned.id}</code>
                                <button
                                  onClick={() => copyId(earned.id)}
                                  className="shrink-0 border-2 border-foreground bg-secondary p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                  aria-label={`Copy certificate ID ${earned.id}`}
                                  aria-pressed={copiedId === earned.id}
                                >
                                  {copiedId === earned.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              <span role="status" className="sr-only">
                                {copiedId === earned.id ? "Certificate ID copied" : ""}
                              </span>
                              <button
                                onClick={() => router.push(`/certificate/${earned.id}`)}
                                className="w-full inline-flex items-center justify-center gap-1.5 border-2 border-foreground bg-foreground text-background px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
                              >
                                <ExternalLink className="w-3 h-3" />
                                View Certificate
                              </button>
                            </div>
                          ) : (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              Not yet earned
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Auth overlay for certificates */}
                {!user && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="bg-card border-2 border-foreground shadow-brutal-lg p-6 flex flex-col items-center gap-4 text-center max-w-xs">
                      <Lock className="w-8 h-8 text-foreground" />
                      <p className="text-sm font-black uppercase tracking-widest text-foreground">
                        Sign in to earn certificates
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Complete typing tests with high accuracy to unlock achievement certificates.
                      </p>
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
                  </div>
                )}
              </div>

              {/* Game History */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-foreground bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    History
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                    Test History
                  </h3>
                </div>

                {history.length === 0 ? (
                  <div className="border-2 border-dashed border-foreground/30 p-6 text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No tests completed yet</p>
                  </div>
                ) : (
                  <div className="border-2 border-foreground bg-card shadow-brutal overflow-hidden">
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b-2 border-foreground bg-secondary">
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mode</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Time</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">WPM</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</th>
                            <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {history.map((game) => (
                            <tr key={game.id} className="border-b border-foreground/10 last:border-0">
                              <td className="px-4 py-3 text-xs font-bold text-muted-foreground">{formatDate(game.created_at)}</td>
                              <td className="px-4 py-3">
                                <span className="text-[10px] font-black uppercase tracking-widest bg-secondary border border-foreground/20 px-2 py-0.5">
                                  {game.text_mode}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs font-mono font-bold">{game.duration}s</td>
                              <td className="px-4 py-3 text-sm font-black font-mono text-primary">{game.wpm}</td>
                              <td className="px-4 py-3 text-sm font-black font-mono">{game.accuracy}%</td>
                              <td className="px-4 py-3 text-sm font-black font-mono text-muted-foreground">{game.errors}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden flex flex-col">
                      {history.map((game) => (
                        <div key={game.id} className="border-b border-foreground/10 last:border-0 px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-secondary border border-foreground/20 px-2 py-0.5">
                              {game.text_mode}
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground">{formatDate(game.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-black font-mono text-primary">{game.wpm} <span className="text-[10px] text-muted-foreground">WPM</span></span>
                            <span className="text-sm font-bold font-mono">{game.accuracy}%</span>
                            <span className="text-sm font-bold font-mono text-muted-foreground">{game.errors} err</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
