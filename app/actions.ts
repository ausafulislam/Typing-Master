"use server"

import { neon } from "@neondatabase/serverless"

export async function saveGameSession(data: {
  name: string
  duration: number
  wpm: number
  accuracy: number
  errors: number
}) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined")
  }

  const sql = neon(process.env.DATABASE_URL)

  const trimmedName = data.name.trim()

  if (!trimmedName) {
    throw new Error("Name is required")
  }

  try {
    const existingSessions = await sql`
      SELECT id, wpm, accuracy, errors 
      FROM game_sessions 
      WHERE name = ${trimmedName}
      ORDER BY wpm DESC, accuracy DESC, errors ASC
      LIMIT 1
    `

    if (existingSessions.length > 0) {
      const existing = existingSessions[0]

      // Algorithm to check if new session is better
      const isBetter =
        data.wpm > existing.wpm ||
        (data.wpm === existing.wpm && data.accuracy > existing.accuracy) ||
        (data.wpm === existing.wpm && data.accuracy === existing.accuracy && data.errors < existing.errors)

      if (isBetter) {
        await sql`
          UPDATE game_sessions 
          SET 
            duration = ${data.duration}, 
            wpm = ${data.wpm}, 
            accuracy = ${data.accuracy}, 
            errors = ${data.errors},
            created_at = CURRENT_TIMESTAMP
          WHERE id = ${existing.id}
        `
      } else {
        // Fake loading time if we're skipping the save
        await new Promise((resolve) => setTimeout(resolve, 800))
      }
    } else {
      // New user, insert record
      await sql`
        INSERT INTO game_sessions (name, duration, wpm, accuracy, errors)
        VALUES (${trimmedName}, ${data.duration}, ${data.wpm}, ${data.accuracy}, ${data.errors})
      `
    }
    return { success: true }
  } catch (error) {
    console.error("Failed to save game session:", error)
    return { success: false, error: "Failed to save game session" }
  }
}

export async function getLeaderboard() {
  if (!process.env.DATABASE_URL) {
    return []
  }

  const sql = neon(process.env.DATABASE_URL)

  try {
    const leaderboard = await sql`
      SELECT name, wpm, accuracy
      FROM game_sessions
      ORDER BY wpm DESC, accuracy DESC, errors ASC
      LIMIT 15
    `
    return leaderboard as { name: string; wpm: number; accuracy: number }[]
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error)
    return []
  }
}
