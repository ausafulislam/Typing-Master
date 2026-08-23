"use server"

import { createClient } from "@/lib/supabase/server"
import { CERTIFICATE_TIERS, LEADERBOARD_PAGE_SIZE, generateCertificateId } from "@/lib/constants"
import { sanitizeName } from "@/lib/name-utils"

const CERT_ID_RETRIES = 5

export async function saveGameSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
  textMode?: string
}) {
  const name = sanitizeName(data.name)
  if (!name) {
    return { success: false, saved: false, error: "Name is required" }
  }

  const supabase = await createClient()

  try {
    // All validation + atomic best-score upsert happens in Postgres.
    const { data: result, error } = await supabase.rpc("submit_game_session", {
      p_name: name,
      p_duration: data.duration,
      p_wpm: data.wpm,
      p_accuracy: data.accuracy,
      p_errors: data.errors,
      p_text_mode: data.textMode || "normal",
    })

    if (error) throw error

    return { success: true, saved: Boolean((result as { saved?: boolean } | null)?.saved) }
  } catch (error: unknown) {
    console.error("Failed to save game session:", error)
    const message =
      error instanceof Error && /Name is required|Invalid score data/.test(error.message)
        ? error.message
        : "Failed to save game session"
    return { success: false, saved: false, error: message }
  }
}

export async function checkNameExists(name: string): Promise<boolean> {
  const safeName = sanitizeName(name)
  if (!safeName) return false

  const supabase = await createClient()

  try {
    // head:true returns count without rows — data will be null, so use count.
    const { count, error } = await supabase
      .from("game_sessions")
      .select("id", { count: "exact", head: true })
      .eq("name", safeName)
      .limit(1)

    if (error) throw error

    return (count ?? 0) > 0
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

    // Count everyone strictly ahead of this player's best score.
    const { count: ahead, error: aheadError } = await supabase
      .from("game_sessions")
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
  const safeName = sanitizeName(name)
  if (!safeName) return []

  const newCerts: { tier: string; id: string }[] = []

  try {
    const { data: existing, error: existingError } = await supabase
      .from("certificates")
      .select("tier")
      .eq("name", safeName)

    if (existingError) throw existingError

    const earnedTiers = new Set((existing ?? []).map((r) => r.tier))

    for (const tier of CERTIFICATE_TIERS) {
      if (earnedTiers.has(tier.name)) continue
      // Client-side pre-check; the RPC re-validates thresholds server-side.
      if (wpm >= tier.minWpm && accuracy >= tier.minAccuracy) {
        let inserted = false
        // Retry with fresh IDs on the rare chance of an ID collision
        for (let attempt = 0; attempt < CERT_ID_RETRIES && !inserted; attempt++) {
          const certId = generateCertificateId(tier)
          const { data: wasInserted, error } = await supabase.rpc("award_certificate", {
            p_id: certId,
            p_name: safeName,
            p_tier: tier.name,
            p_wpm: wpm,
            p_accuracy: accuracy,
          })
          if (error) {
            console.error(`Failed to award ${tier.name} certificate:`, error)
            break
          }
          if (wasInserted) {
            newCerts.push({ tier: tier.name, id: certId })
            inserted = true
          }
        }
      }
    }

    return newCerts
  } catch (error: unknown) {
    console.error("Failed to award certificates:", error)
    return []
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

export async function getPlayerCertificates(name: string) {
  const safeName = sanitizeName(name)
  if (!safeName) return []

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("id, tier, wpm, accuracy, created_at")
      .eq("name", safeName)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch certificates:", error)
    return []
  }
}

export async function getPlayerGameHistory(name: string) {
  const safeName = sanitizeName(name)
  if (!safeName) return []

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("game_history")
      .select("id, text_mode, duration, wpm, accuracy, errors, created_at")
      .eq("name", safeName)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error
    return data ?? []
  } catch (error: unknown) {
    console.error("Failed to fetch game history:", error)
    return []
  }
}
