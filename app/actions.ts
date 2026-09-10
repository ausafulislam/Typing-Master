"use server"

import { createClient } from "@/lib/supabase/server"
import { LEADERBOARD_PAGE_SIZE, MAX_LEADERBOARD_ENTRIES } from "@/lib/constants"

export async function getLeaderboard(page = 1) {
  const supabase = await createClient()
  const safePage = Math.max(1, Math.floor(page))
  const from = (safePage - 1) * LEADERBOARD_PAGE_SIZE

  // The board is capped at the top MAX_LEADERBOARD_ENTRIES scores.
  if (from >= MAX_LEADERBOARD_ENTRIES) {
    return { entries: [], page: safePage, hasMore: false, error: null }
  }
  const to = Math.min(from + LEADERBOARD_PAGE_SIZE - 1, MAX_LEADERBOARD_ENTRIES - 1)

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
    const shownSoFar = from + entries.length
    const hasMore = count !== null ? shownSoFar < Math.min(count, MAX_LEADERBOARD_ENTRIES) : false

    return { entries, page: safePage, hasMore, error: null }
  } catch (error: unknown) {
    console.error("Failed to fetch leaderboard:", error)
    return { entries: [], page: safePage, hasMore: false, error: "Failed to load leaderboard" }
  }
}

export interface CertificateRecord {
  id: string
  name: string
  tier: string
  wpm: number
  accuracy: number
  date: string
}

function normalizeCertificateId(id: string): string | null {
  const raw = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (raw.length !== 11) return null
  return `${raw.slice(0, 4)}.${raw.slice(4, 7)}.${raw.slice(7, 11)}`
}

export async function verifyCertificate(id: string): Promise<CertificateRecord | null> {
  const cleanId = normalizeCertificateId(id)
  if (!cleanId) return null

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, name, tier, wpm, accuracy, created_at")
      .eq("id", cleanId)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      id: data.id,
      name: data.name,
      tier: data.tier,
      wpm: data.wpm,
      accuracy: data.accuracy,
      date: data.created_at,
    }
  } catch (error: unknown) {
    console.error("Failed to verify certificate:", error)
    return null
  }
}

// ============================================================
// Phase 2: Account-based actions
// ============================================================

interface LocalScore {
  wpm: number
  accuracy: number
  errors: number
  duration: number
  textMode: string
  createdAt: string
}

export async function saveTypedResult(data: {
  wpm: number
  accuracy: number
  errors: number
  duration: number
  textMode?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  // Validate ranges server-side
  if (data.wpm < 0 || data.wpm > 400 || data.accuracy < 0 || data.accuracy > 100 || data.errors < 0 || data.duration <= 0 || data.duration > 300) {
    return { success: false, error: "Invalid score data" }
  }

  const textMode = data.textMode || "normal"
  const validModes = ["normal", "numbers", "punctuation", "quotes"]
  const mode = validModes.includes(textMode) ? textMode : "normal"

  try {
    const { error } = await supabase.from("typing_results").insert({
      user_id: user.id,
      wpm: data.wpm,
      accuracy: data.accuracy,
      errors: data.errors,
      duration: data.duration,
      text_mode: mode,
    })

    if (error) throw error

    return { success: true }
  } catch (error: unknown) {
    console.error("Failed to save typed result:", error)
    return { success: false, error: "Failed to save result" }
  }
}

export async function syncLocalScores(scores: LocalScore[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, synced: 0, error: "Not authenticated" }
  }

  if (!Array.isArray(scores) || scores.length === 0) {
    return { success: true, synced: 0 }
  }

  // Limit to 50 scores per sync to prevent abuse
  const toSync = scores.slice(0, 50)

  const validModes = ["normal", "numbers", "punctuation", "quotes"]

  const rows = toSync.map((s) => ({
    user_id: user.id,
    wpm: Math.max(0, Math.min(400, Math.round(s.wpm))),
    accuracy: Math.max(0, Math.min(100, s.accuracy)),
    errors: Math.max(0, Math.round(s.errors)),
    duration: Math.max(1, Math.min(300, Math.round(s.duration))),
    text_mode: validModes.includes(s.textMode) ? s.textMode : "normal",
    created_at: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
  }))

  try {
    const { error, data } = await supabase.from("typing_results").insert(rows).select("id")

    if (error) throw error

    return { success: true, synced: data?.length ?? 0 }
  } catch (error: unknown) {
    console.error("Failed to sync local scores:", error)
    return { success: false, synced: 0, error: "Failed to sync scores" }
  }
}

export async function getUserProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error: unknown) {
    console.error("Failed to fetch user profile:", error)
    return null
  }
}

export async function getUserBestResult() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data, error } = await supabase
      .from("typing_results")
      .select("wpm, accuracy, errors")
      .eq("user_id", user.id)
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error: unknown) {
    console.error("Failed to fetch user best result:", error)
    return null
  }
}

export async function getUserResultHistory() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    const { data, error } = await supabase
      .from("typing_results")
      .select("id, wpm, accuracy, errors, duration, text_mode, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch user result history:", error)
    return []
  }
}

export async function getUserResults() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { best: null, history: [] as Awaited<ReturnType<typeof getUserResultHistory>> }

  const [best, history] = await Promise.all([
    getUserBestResult(),
    getUserResultHistory(),
  ])

  return { best, history }
}

export async function getUserRank() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    // Get user's best score
    const { data: best, error: bestError } = await supabase
      .from("typing_results")
      .select("wpm, accuracy, errors")
      .eq("user_id", user.id)
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (bestError) throw bestError
    if (!best) return null

    // Count everyone strictly ahead
    const { count: ahead, error: aheadError } = await supabase
      .from("typing_results")
      .select("id", { count: "exact", head: true })
      .or(
        `wpm.gt.${best.wpm},and(wpm.eq.${best.wpm},accuracy.gt.${best.accuracy}),and(wpm.eq.${best.wpm},accuracy.eq.${best.accuracy},errors.lt.${best.errors})`,
      )

    if (aheadError) throw aheadError

    return {
      wpm: best.wpm,
      accuracy: best.accuracy,
      rank: (ahead ?? 0) + 1,
    }
  } catch (error: unknown) {
    console.error("Failed to fetch user rank:", error)
    return null
  }
}

export async function getUserCertificates() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  try {
    // Get user's display_name from profile for cert lookup
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.display_name) return []

    const { data, error } = await supabase
      .from("certificates")
      .select("id, tier, wpm, accuracy, created_at")
      .eq("name", profile.display_name)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch user certificates:", error)
    return []
  }
}
