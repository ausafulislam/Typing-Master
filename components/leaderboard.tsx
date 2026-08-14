"use client"

import { useEffect, useState } from "react"
import { getLeaderboard } from "@/app/actions"
import { Trophy } from "lucide-react"

interface LeaderboardEntry {
  name: string
  wpm: number
  accuracy: number
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getLeaderboard()
        setData(result)
      } catch (error) {
        console.error("Failed to load leaderboard", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="w-full max-w-2xl mt-16 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-300">
      <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold">Top Typists</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  WPM
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No scores yet. Be the first!
                  </td>
                </tr>
              ) : (
                data.map((user, index) => (
                  <tr key={index} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {index === 0 && <span className="text-yellow-500">🥇</span>}
                      {index === 1 && <span className="text-gray-400">🥈</span>}
                      {index === 2 && <span className="text-amber-700">🥉</span>}
                      {index > 2 && <span className="text-muted-foreground">#{index + 1}</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-primary">
                      {user.wpm}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-muted-foreground">
                      {user.accuracy}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
