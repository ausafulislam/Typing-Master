import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        duration INTEGER NOT NULL,
        wpm INTEGER NOT NULL,
        accuracy INTEGER NOT NULL,
        errors INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log("Migration completed successfully.")
  } catch (error) {
    console.error("Migration failed:", error)
  }
}

main()
