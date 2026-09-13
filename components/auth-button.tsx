"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth-provider"
import { LogIn, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const chipClasses =
  "inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 sm:px-3 py-2 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal whitespace-nowrap"

export function AuthButton({ className = "" }: { className?: string }) {
  const { user, loading } = useAuth()
  const [signingIn, setSigningIn] = useState(false)
  const supabase = createClient()

  const handleSignIn = async () => {
    setSigningIn(true)
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (loading) {
    return (
      <div className={`${chipClasses} ${className} opacity-50 pointer-events-none`}>
        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    )
  }

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url ?? user.user_metadata?.picture
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User"
    const displayName = fullName.split(" ")[0]

    return (
      <Link href="/profile" className={`${chipClasses} ${className}`} aria-label={displayName}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-foreground"
            unoptimized
          />
        ) : (
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        )}
        <span className="max-w-[100px] truncate">{displayName}</span>
      </Link>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={signingIn}
      className={`${chipClasses} ${className} cursor-pointer`}
    >
      <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      Sign In
    </button>
  )
}