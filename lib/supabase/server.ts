import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"
import { cookies } from "next/headers"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. " +
      "Check your .env.local file."
  )
}

const supabaseUrl: string = url
const supabaseKey: string = key

const cookiesMethods: CookieMethodsServer = {
  getAll() {
    // cookies() is already awaited at call site
    return []
  },
  setAll() {
    // Called from a Server Component; safe to ignore.
  },
}

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  const cookieStore = await cookies()

  const methods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      } catch {
        // Called from a Server Component; safe to ignore.
      }
    },
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: methods,
  })
}
