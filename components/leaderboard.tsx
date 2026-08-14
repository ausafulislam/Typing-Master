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

  const rankLabel = (index: number) => {
    if (index === 0) return "1ST"
    if (index === 1) return "2ND"
    if (index === 2) return "3RD"
    return `#${index + 1}`
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
            <tbody className="divide-y-2 divide-foreground/15">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-bold uppercase text-muted-foreground text-sm">
                    Loading leaderboard...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center font-bold uppercase text-muted-foreground text-sm">
                    No scores yet. Be the first!
                  </td>
                </tr>
              ) : (
                data.map((user, index) => (
                  <tr key={index} className="hover:bg-secondary transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block border-2 border-foreground px-2 py-0.5 text-xs font-black ${
                          index < 3 ? "bg-primary text-primary-foreground" : "bg-card text-foreground"
                        }`}
                      >
                        {rankLabel(index)}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-sm font-black text-foreground">{user.name}</td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-lg font-black font-mono text-primary">
                      {user.wpm}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap text-right text-sm font-bold font-mono text-muted-foreground">
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
