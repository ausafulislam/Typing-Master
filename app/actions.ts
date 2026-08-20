"use server"

import { createClient } from "@/lib/supabase/server"
import { LEADERBOARD_PAGE_SIZE, CERTIFICATE_TIERS, generateCertificateId, type CertificateTier } from "@/lib/constants"

const MAX_NAME_LENGTH = 20
const MAX_WPM = 400
const MAX_ERRORS = 999999
const MAX_DURATION = 300

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

function sanitizeName(name: string): string {
  return name
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
}

function validateSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
}): string | null {
  const name = sanitizeName(data.name)

  if (!name) return "Name is required"
  if (name.length > MAX_NAME_LENGTH) return "Name is too long"

  const numbersValid =
    Number.isFinite(data.wpm) &&
    Number.isFinite(data.accuracy) &&
    Number.isFinite(data.errors) &&
    Number.isFinite(data.duration) &&
    data.wpm >= 0 &&
    data.wpm <= MAX_WPM &&
    data.accuracy >= 0 &&
    data.accuracy <= 100 &&
    data.errors >= 0 &&
    data.errors <= MAX_ERRORS &&
    data.duration > 0 &&
    data.duration <= MAX_DURATION

  if (!numbersValid) return "Invalid score data"

  return null
}

export async function saveGameSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
  textMode?: string
}) {
  const name = sanitizeName(data.name)
  const textMode = data.textMode || "normal"

  const validationError = validateSession(data)
  if (validationError) {
    return { success: false, saved: false, error: validationError }
  }

  const supabase = await createClient()

  // Insert into game_history (every game)
  const { error: historyError } = await supabase.from("game_history").insert({
    name,
    text_mode: textMode,
    duration: data.duration,
    wpm: data.wpm,
    accuracy: data.accuracy,
    errors: data.errors,
  })
  if (historyError) {
    console.error("Failed to save game history:", historyError)
  }

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

  try {
    const existing = (await findBest())[0]

    if (existing) {
      if (!isBetter(data, existing)) {
        return { success: true, saved: false }
      }

      // Conditional update: only update if the existing row is still ours to beat
      const { data: updated, error: updateError } = await supabase
        .from("game_sessions")
        .update({
          duration: data.duration,
          wpm: data.wpm,
          accuracy: data.accuracy,
          errors: data.errors,
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id")

      if (updateError) throw updateError

      // If no rows updated, another request overwrote it first
      if (!updated || updated.length === 0) {
        return { success: true, saved: false }
      }

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
        const raced = (await findBest())[0]
        if (!raced) throw insertError
        if (!isBetter(data, raced)) {
          return { success: true, saved: false }
        }
        const { data: racedUpdated, error: racedUpdateError } = await supabase
          .from("game_sessions")
          .update({
            duration: data.duration,
            wpm: data.wpm,
            accuracy: data.accuracy,
            errors: data.errors,
            created_at: new Date().toISOString(),
          })
          .eq("id", raced.id)
          .select("id")

        if (racedUpdateError) throw racedUpdateError
        if (!racedUpdated || racedUpdated.length === 0) {
          return { success: true, saved: false }
        }
        return { success: true, saved: true }
      }
      throw insertError
    }

    return { success: true, saved: true }
  } catch (error: unknown) {
    console.error("Failed to save game session:", error)
    return { success: false, saved: false, error: "Failed to save game session" }
  }
}

export async function checkNameExists(name: string): Promise<boolean> {
  const safeName = sanitizeName(name)
  if (!safeName) return false

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("name", safeName)
      .limit(1)

    if (error) throw error

    return (data ?? []).length > 0
  } catch (error: unknown) {
    console.error("Failed to check name:", error)
    return false
  }
}

export async function getPlayerStats(name: string) {
  const safeName = sanitizeName(name)
  if (!safeName) return null

  const supabase = await createClient()

  try {
    const { data: best, error: bestError } = await supabase
      .from("game_sessions")
      .select("wpm, accuracy, errors")
      .eq("name", safeName)
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (bestError) throw bestError
    if (!best) return null

    const { count: rank, error: rankError } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .or(`wpm.gt.${best.wpm},and(wpm.eq.${best.wpm},accuracy.gt.${best.accuracy}),and(wpm.eq.${best.wpm},accuracy.eq.${best.accuracy},errors.lt.${best.errors})`)

    if (rankError) throw rankError

    return {
      wpm: best.wpm,
      accuracy: best.accuracy,
      rank: (rank ?? 0) + 1,
    }
  } catch (error: unknown) {
    console.error("Failed to fetch player stats:", error)
    return null
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
  } catch (error: unknown) {
    console.error("Failed to fetch leaderboard:", error)
    return { entries: [], page: safePage, hasMore: false, error: "Failed to load leaderboard" }
  }
}

export async function awardCertificates(name: string, wpm: number, accuracy: number) {
  const supabase = await createClient()
  const newCerts: { tier: string; id: string }[] = []

  try {
    const { data: existing } = await supabase
      .from("certificates")
      .select("tier")
      .eq("name", name) as { data: { tier: string }[] | null }

    const earnedTiers = new Set((existing ?? []).map((r: { tier: string }) => r.tier))

    for (const tier of CERTIFICATE_TIERS) {
      if (earnedTiers.has(tier.name)) continue
      if (wpm >= tier.minWpm && accuracy >= tier.minAccuracy) {
        const certId = generateCertificateId(tier, wpm, accuracy)
        const { error } = await supabase.from("certificates").insert({
          id: certId,
          name,
          tier: tier.name,
          wpm,
          accuracy,
        })
        if (!error) {
          newCerts.push({ tier: tier.name, id: certId })
        }
      }
    }

    return newCerts
  } catch (error: unknown) {
    console.error("Failed to award certificates:", error)
    return []
  }
}

export async function verifyCertificate(id: string) {
  const supabase = await createClient()
  // Normalize: strip non-alphanumeric, rebuild in 4-3-4 format
  const raw = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (raw.length < 4) return null
  const cleanId = raw.slice(0, 4) + "." + raw.slice(4, 7) + "." + raw.slice(7, 11)

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, name, tier, wpm, accuracy, created_at")
      .eq("id", cleanId)
      .maybeSingle() as { data: { id: string; name: string; tier: string; wpm: number; accuracy: number; created_at: string } | null; error: unknown }

    if (error) throw error
    if (!data) return null

    return {
      valid: true,
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

export async function getPlayerCertificates(name: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, tier, wpm, accuracy, created_at")
      .eq("name", name)
      .order("created_at", { ascending: false }) as { data: { id: string; tier: string; wpm: number; accuracy: number; created_at: string }[] | null; error: unknown }

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch certificates:", error)
    return []
  }
}

export async function getPlayerGameHistory(name: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("game_history")
      .select("id, text_mode, duration, wpm, accuracy, errors, created_at")
      .eq("name", name)
      .order("created_at", { ascending: false })
      .limit(100) as { data: { id: number; text_mode: string; duration: number; wpm: number; accuracy: number; errors: number; created_at: string }[] | null; error: unknown }

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch game history:", error)
    return []
  }
}
