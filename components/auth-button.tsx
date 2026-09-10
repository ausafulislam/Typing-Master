"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { LogIn, LogOut, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const btnClasses =
  "inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-1.5 sm:py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"

export function AuthButton() {
  const { user, loading } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const supabase = createClient()

  const handleSignIn = async (provider: "google" | "github") => {
    setSigningIn(true)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className={`${btnClasses} opacity-50 pointer-events-none`}>
        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    )
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture
    const displayName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User"

    return (
      <div className="flex items-center gap-2">
        <Link href="/profile" className={`${btnClasses} gap-2`}>
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={16}
              height={16}
              className="w-4 h-4 sm:w-5 sm:h-5 border border-foreground"
              unoptimized
            />
          ) : (
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          )}
          <span className="hidden sm:inline max-w-[80px] truncate">{displayName}</span>
        </Link>
        <button
          onClick={handleSignOut}
          className={`${btnClasses} cursor-pointer`}
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => handleSignIn("google")}
        disabled={signingIn}
        className={`${btnClasses} cursor-pointer`}
      >
        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Google</span>
      </button>
      <button
        onClick={() => handleSignIn("github")}
        disabled={signingIn}
        className={`${btnClasses} cursor-pointer`}
      >
        <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">GitHub</span>
      </button>
    </div>
  )
}
