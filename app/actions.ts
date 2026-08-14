"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveGameSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
}) {
  const trimmedName = data.name.trim()

  if (!trimmedName) {
    return { success: false, error: "Name is required" }
  }

  const supabase = await createClient()

  try {
    // Look up this player's current best run.
    const { data: existingSessions, error: selectError } = await supabase
      .from("game_sessions")
      .select("id, wpm, accuracy, errors")
      .eq("name", trimmedName)
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .limit(1)

    if (selectError) throw selectError

    if (existingSessions && existingSessions.length > 0) {
      const existing = existingSessions[0]

      const isBetter =
        data.wpm > existing.wpm ||
        (data.wpm === existing.wpm && data.accuracy > existing.accuracy) ||
        (data.wpm === existing.wpm && data.accuracy === existing.accuracy && data.errors < existing.errors)

      if (isBetter) {
        const { error: updateError } = await supabase
          .from("game_sessions")
          .update({
            duration: data.duration,
            wpm: data.wpm,
            accuracy: data.accuracy,
            errors: data.errors,
            created_at: new Date().toISOString(),
          })
          .eq("id", existing.id)

        if (updateError) throw updateError
      } else {
        // Slight delay so the UI feedback feels intentional when skipping.
        await new Promise((resolve) => setTimeout(resolve, 600))
      }
    } else {
      const { error: insertError } = await supabase.from("game_sessions").insert({
        name: trimmedName,
        duration: data.duration,
        wpm: data.wpm,
        accuracy: data.accuracy,
        errors: data.errors,
      })

      if (insertError) throw insertError
    }

    return { success: true }
  } catch (error) {
    console.error("Failed to save game session:", error)
    return { success: false, error: "Failed to save game session" }
  }
}

export async function getLeaderboard() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from("game_sessions")
      .select("name, wpm, accuracy")
      .order("wpm", { ascending: false })
      .order("accuracy", { ascending: false })
      .order("errors", { ascending: true })
      .limit(15)

    if (error) throw error

    return (data ?? []) as { name: string; wpm: number; accuracy: number }[]
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error)
    return []
  }
}
