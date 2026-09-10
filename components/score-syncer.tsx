"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/components/auth-provider"
import { syncLocalScores } from "@/app/actions"

const LOCAL_SCORES_KEY = "tmx-unsynced-scores"

interface LocalScore {
  wpm: number
  accuracy: number
  errors: number
  duration: number
  textMode: string
  createdAt: string
}

export function ScoreSyncer() {
  const { user } = useAuth()
  const hasSyncedRef = useRef(false)

  useEffect(() => {
    if (!user || hasSyncedRef.current) return

    const raw = localStorage.getItem(LOCAL_SCORES_KEY)
    if (!raw) return

    try {
      const scores: LocalScore[] = JSON.parse(raw)
      if (!Array.isArray(scores) || scores.length === 0) return

      hasSyncedRef.current = true

      syncLocalScores(scores).then((result) => {
        if (result.success && result.synced > 0) {
          localStorage.removeItem(LOCAL_SCORES_KEY)
        }
      })
    } catch {
      // Corrupt data — clear it
      localStorage.removeItem(LOCAL_SCORES_KEY)
    }
  }, [user])

  return null
}
