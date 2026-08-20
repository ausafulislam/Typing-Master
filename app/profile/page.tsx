"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Keyboard, Trophy, Medal, Gamepad2, Copy, Check, ExternalLink } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { getPlayerStats, getPlayerCertificates, getPlayerGameHistory } from "../actions"
import { CERTIFICATE_TIERS } from "@/lib/constants"
import { useRouter } from "next/navigation"

const NAME_KEY = "typing-game-nickname"

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

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState<string | null>(null)
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [history, setHistory] = useState<GameEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const stored = safeGetItem(NAME_KEY)
    setName(stored)
  }, [])

  useEffect(() => {
    if (!name) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)

    Promise.all([
      getPlayerStats(name),
      getPlayerCertificates(name),
      getPlayerGameHistory(name),
    ]).then(([playerStats, certs, hist]) => {
      if (!cancelled) {
        setStats(playerStats)
        setCertificates(certs)
        setHistory(hist)
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [name])

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalGames = history.length
  const avgWpm = totalGames > 0 ? Math.round(history.reduce((s, g) => s + g.wpm, 0) / totalGames) : 0
  const avgAccuracy = totalGames > 0 ? Math.round(history.reduce((s, g) => s + g.accuracy, 0) / totalGames * 10) / 10 : 0

  if (!name) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
          <div className="bg-foreground text-background p-3">
            <Keyboard className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">No Profile Found</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              Play a typing test first to create your profile and start earning certificates.
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar
        rightContent={
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        }
      />

      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
          {/* Player Name */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player</span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">{name}</h2>
          </div>

          {loading ? (
            <div className="border-2 border-foreground bg-card px-6 py-4 shadow-brutal text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">{totalGames}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Games</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">{stats?.wpm ?? avgWpm}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Best WPM</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Medal className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">{avgAccuracy}%</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg Accuracy</span>
                </div>
                <div className="border-2 border-foreground bg-card p-4 shadow-brutal flex flex-col gap-1">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <span className="text-2xl font-black font-mono leading-none tabular-nums text-primary">#{stats?.rank ?? "-"}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Rank</span>
                </div>
              </div>

              {/* Certificates */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-foreground bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    Certs
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                    Certificates
                  </h3>
                </div>

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
                            <div className="flex items-center justify-between gap-2">
                              <code className="text-xs font-mono font-bold text-primary">{earned.id}</code>
                              <button
                                onClick={() => copyId(earned.id)}
                                className="border-2 border-foreground bg-secondary p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                aria-label="Copy certificate ID"
                              >
                                {copiedId === earned.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
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

              {/* Game History */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="border-2 border-foreground bg-foreground text-background px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    History
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                    Game History
                  </h3>
                </div>

                {history.length === 0 ? (
                  <div className="border-2 border-dashed border-foreground/30 p-6 text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No games played yet</p>
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
    </div>
  )
}
