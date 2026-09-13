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

  // Reset the "already synced" flag whenever the session changes. This means a
  // guest who plays and then signs back in within the same session gets their
  // new local scores synced too.
  useEffect(() => {
    if (!user) {
      hasSyncedRef.current = false
      return
    }

    if (hasSyncedRef.current) return

    let raw: string | null = null
    try {
      raw = localStorage.getItem(LOCAL_SCORES_KEY)
    } catch {
      return
    }
    if (!raw) return

    try {
      const scores: LocalScore[] = JSON.parse(raw)
      if (!Array.isArray(scores) || scores.length === 0) return

      // Only mark as synced AFTER a successful sync (failure retries on next
      // mount/login instead of abandoning the scores forever).
      syncLocalScores(scores)
        .then((result) => {
          if (result.success) {
            hasSyncedRef.current = true
            localStorage.removeItem(LOCAL_SCORES_KEY)
          }
        })
        .catch(() => {
          // Keep local scores; they will be retried on the next page load/login.
        })
    } catch {
      // Corrupt data — clear it
      localStorage.removeItem(LOCAL_SCORES_KEY)
    }
  }, [user])

  return null
}
