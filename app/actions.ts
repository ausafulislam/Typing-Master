"use server"

import { createClient } from "@/lib/supabase/server"

const MAX_NAME_LENGTH = 20
const LEADERBOARD_PAGE_SIZE = 15

interface ScoreData {
  wpm: number
  accuracy: number
  errors: number
}

interface ExistingRow extends ScoreData {
  id: number
}

function isBetter(newScore: ScoreData, existing: ScoreData): boolean {
  return (
    newScore.wpm > existing.wpm ||
    (newScore.wpm === existing.wpm && newScore.accuracy > existing.accuracy) ||
    (newScore.wpm === existing.wpm &&
      newScore.accuracy === existing.accuracy &&
      newScore.errors < existing.errors)
  )
}

function validateSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
}): string | null {
  const name = data.name.trim()

  if (!name) return "Name is required"
  if (name.length > MAX_NAME_LENGTH) return "Name is too long"

  const numbersValid =
    Number.isFinite(data.wpm) &&
    Number.isFinite(data.accuracy) &&
    Number.isFinite(data.errors) &&
    Number.isFinite(data.duration) &&
    data.wpm >= 0 &&
    data.accuracy >= 0 &&
    data.accuracy <= 100 &&
    data.errors >= 0 &&
    data.duration > 0

  if (!numbersValid) return "Invalid score data"

  return null
}

export async function saveGameSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
}) {
  const name = data.name.trim()

  const validationError = validateSession(data)
  if (validationError) {
    return { success: false, saved: false, error: validationError }
  }

  const supabase = await createClient()

  const findBest = async () => {
    const { data: sessions, error } = await supabase
      .from("game_sessions")
      .select("id, wpm, accuracy, errors")
      .eq("name", name)
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .limit(1)

    if (error) throw error
    return (sessions ?? []) as ExistingRow[]
  }

  const updateBest = async (id: number) => {
    const { error } = await supabase
      .from("game_sessions")
      .update({
        duration: data.duration,
        wpm: data.wpm,
        accuracy: data.accuracy,
        errors: data.errors,
        created_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) throw error
  }

  try {
    const existing = (await findBest())[0]

    if (existing) {
      if (!isBetter(data, existing)) {
        return { success: true, saved: false }
      }
      await updateBest(existing.id)
      return { success: true, saved: true }
    }

    const { error: insertError } = await supabase.from("game_sessions").insert({
      name,
      duration: data.duration,
      wpm: data.wpm,
      accuracy: data.accuracy,
      errors: data.errors,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique-index race: another request created this name first.
        // Re-read and apply the compare/update path instead of inserting.
        const raced = (await findBest())[0]
        if (!raced) throw insertError
        if (!isBetter(data, raced)) {
          return { success: true, saved: false }
        }
        await updateBest(raced.id)
        return { success: true, saved: true }
      }
      throw insertError
    }

    return { success: true, saved: true }
  } catch (error) {
    console.error("Failed to save game session:", error)
    return { success: false, saved: false, error: "Failed to save game session" }
  }
}

export async function getLeaderboard(page = 1) {
  const supabase = await createClient()
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * LEADERBOARD_PAGE_SIZE
  const to = from + LEADERBOARD_PAGE_SIZE - 1

  try {
    const { data, error, count } = await supabase
      .from("game_sessions")
      .select("name, wpm, accuracy", { count: "exact" })
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .order("id", { ascending: false })
      .range(from, to)

    if (error) throw error

    const entries = (data ?? []) as { name: string; wpm: number; accuracy: number }[]
    const hasMore = count !== null ? from + entries.length < count : false

    return { entries, page: safePage, hasMore, error: null }
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error)
    return { entries: [], page: safePage, hasMore: false, error: "Failed to load leaderboard" }
  }
}
