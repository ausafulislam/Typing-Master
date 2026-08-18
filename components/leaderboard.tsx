"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { getLeaderboard } from "@/app/actions"
import { LEADERBOARD_PAGE_SIZE } from "@/lib/constants"
import { ChevronLeft, ChevronRight, Trophy, RefreshCw } from "lucide-react"

interface LeaderboardEntry {
  name: string
  wpm: number
  accuracy: number
}

interface LeaderboardData {
  entries: LeaderboardEntry[]
  page: number
  hasMore: boolean
  error: string | null
}

const rankLabel = (rank: number) => {
  if (rank === 1) return "1ST"
  if (rank === 2) return "2ND"
  if (rank === 3) return "3RD"
  return `#${rank}`
}

const rankStyle = (rank: number) => {
  if (rank === 1) return "bg-primary text-primary-foreground"
  if (rank === 2) return "bg-secondary text-secondary-foreground border-2"
  if (rank === 3) return "bg-secondary text-secondary-foreground border-2"
  return "bg-card text-muted-foreground border-2"
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  const fetchPage = useCallback(async (targetPage: number) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const result = await getLeaderboard(targetPage)
      if (!controller.signal.aborted) {
        setData(result)
      }
    } catch {
      if (!controller.signal.aborted) {
        setData({ entries: [], page: targetPage, hasMore: false, error: "Failed to load leaderboard" })
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
    return () => abortRef.current?.abort()
  }, [fetchPage])

  const currentPage = data?.page ?? 1
  const entries = data?.entries ?? []
  const hasMore = data?.hasMore ?? false
  const loadError = data?.error ?? null

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === currentPage || loading) return
    fetchPage(targetPage)
  }

  const isLoading = loading && !data

  return (
    <div className="w-full max-w-2xl">
      <div className="border-2 border-foreground shadow-brutal-lg overflow-hidden">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b-2 border-foreground bg-primary text-primary-foreground flex items-center gap-2 sm:gap-3">
          <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
          <h3 className="text-base sm:text-xl font-black uppercase tracking-tight">Top Typists</h3>
        </div>

        {/* Content */}
        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
          {/* Desktop Table */}
          <table className="w-full hidden sm:table" aria-label="Leaderboard rankings">
            <caption className="sr-only">Leaderboard rankings showing top typists by WPM and accuracy</caption>
            <thead className="bg-secondary sticky top-0 z-10 border-b-2 border-foreground">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest w-16">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest">
                  Player
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest w-20">
                  WPM
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest w-24">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody aria-busy={loading} className="divide-y-2 divide-foreground/10">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center font-bold uppercase text-muted-foreground text-sm">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <p className="font-bold uppercase text-destructive text-sm mb-3">Failed to load</p>
                    <button
                      onClick={() => fetchPage(currentPage)}
                      className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry
                    </button>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center font-bold uppercase text-muted-foreground text-sm">
                    {currentPage > 1 ? "No more scores" : "No scores yet. Be the first!"}
                  </td>
                </tr>
              ) : (
                entries.map((user, index) => {
                  const rank = (currentPage - 1) * LEADERBOARD_PAGE_SIZE + index + 1
                  return (
                    <tr key={`${rank}-${user.name}`} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-black border-2 border-foreground ${rank <= 3 ? rankStyle(rank) : "bg-card"}`}>
                          {rankLabel(rank)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-foreground">{user.name}</td>
                      <td className="px-4 py-3 text-right text-base font-black font-mono text-primary tabular-nums">
                        {user.wpm}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold font-mono text-muted-foreground tabular-nums">
                        {user.accuracy}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y-2 divide-foreground/10" role="list" aria-label="Leaderboard rankings">
            {isLoading ? (
              <div className="px-4 py-10 text-center font-bold uppercase text-muted-foreground text-sm">
                Loading leaderboard...
              </div>
            ) : loadError ? (
              <div className="px-4 py-10 text-center">
                <p className="font-bold uppercase text-destructive text-sm mb-3">Failed to load</p>
                <button
                  onClick={() => fetchPage(currentPage)}
                  className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </button>
              </div>
            ) : entries.length === 0 ? (
              <div className="px-4 py-10 text-center font-bold uppercase text-muted-foreground text-sm">
                {currentPage > 1 ? "No more scores" : "No scores yet. Be the first!"}
              </div>
            ) : (
              entries.map((user, index) => {
                const rank = (currentPage - 1) * LEADERBOARD_PAGE_SIZE + index + 1
                return (
                  <div
                    key={`${rank}-${user.name}`}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
                    role="listitem"
                  >
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-black border-2 border-foreground ${rank <= 3 ? rankStyle(rank) : "bg-card"}`}>
                      {rankLabel(rank)}
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-bold text-foreground truncate">
                      {user.name}
                    </span>
                    <div className="shrink-0 flex items-center gap-3">
                      <span className="text-sm font-black font-mono text-primary tabular-nums">{user.wpm}</span>
                      <span className="text-xs font-bold font-mono text-muted-foreground tabular-nums">{user.accuracy}%</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="border-t-2 border-foreground bg-secondary flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="inline-flex items-center gap-1 border-2 border-foreground bg-card px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Prev
          </button>
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-muted-foreground">
            {loading ? "..." : `Page ${currentPage}`}
          </p>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={!hasMore || loading}
            className="inline-flex items-center gap-1 border-2 border-foreground bg-card px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
