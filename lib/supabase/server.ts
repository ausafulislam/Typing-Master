import { createServerClient, type CookieMethodsServer } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. " +
        "Copy .env.example to .env.local and fill in your Supabase credentials."
    )
  }

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
