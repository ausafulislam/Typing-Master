"use client"

import { useCallback, useEffect, useState } from "react"
import { getLeaderboard } from "@/app/actions"
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react"

const PAGE_SIZE = 15

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

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPage = useCallback(async (targetPage: number) => {
    setLoading(true)
    try {
      const result = await getLeaderboard(targetPage)
      setData(result)
    } catch {
      setData({ entries: [], page: targetPage, hasMore: false, error: "Failed to load leaderboard" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPage(1)
  }, [fetchPage])

  const currentPage = data?.page ?? 1
  const entries = data?.entries ?? []
  const hasMore = data?.hasMore ?? false
  const loadError = data?.error ?? null

  const goToPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage === currentPage || loading) return
    fetchPage(targetPage)
  }

  return (
    <div className="w-full max-w-2xl mt-4">
      <div className="bg-card border-2 border-foreground shadow-brutal-lg overflow-hidden">
        <div className="p-4 border-b-2 border-foreground flex items-center gap-3 bg-primary text-primary-foreground">
          <Trophy className="w-6 h-6" />
          <h3 className="text-xl font-black uppercase tracking-tight">Top Typists</h3>
        </div>
        <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-secondary sticky top-0 z-10 border-b-2 border-foreground">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] font-black text-foreground uppercase tracking-widest">
                  Rank
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-black text-foreground uppercase tracking-widest">
                  Player
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-black text-foreground uppercase tracking-widest">
                  WPM
                </th>
                <th className="px-5 py-3 text-right text-[10px] font-black text-foreground uppercase tracking-widest">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody aria-live="polite" aria-busy={loading} className="divide-y-2 divide-foreground/15">
              {loading && !data ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-bold uppercase text-muted-foreground text-sm">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-bold uppercase text-destructive text-sm">
                    Failed to load leaderboard
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-bold uppercase text-muted-foreground text-sm">
                    {currentPage > 1 ? "No more scores on this page" : "No scores yet. Be the first!"}
                  </td>
                </tr>
              ) : (
                entries.map((user, index) => {
                  const rank = (currentPage - 1) * PAGE_SIZE + index + 1
                  return (
                    <tr key={`${rank}-${user.name}`} className="hover:bg-secondary transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block border-2 border-foreground px-2 py-0.5 text-xs font-black ${
                            rank <= 3 ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                          }`}
                        >
                          {rankLabel(rank)}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-sm font-black text-foreground">{user.name}</td>
                      <td className="px-5 py-3 whitespace-nowrap text-right text-lg font-black font-mono text-primary tabular-nums">
                        {user.wpm}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold font-mono text-muted-foreground tabular-nums">
                        {user.accuracy}%
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-foreground bg-secondary flex items-center justify-between px-4 py-3">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {loading ? "Loading..." : `Page ${currentPage}`}
          </p>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={!hasMore || loading}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-brutal"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
