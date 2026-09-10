"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, LogIn } from "lucide-react"
import { Leaderboard } from "@/components/leaderboard"
import { APP_VERSION } from "@/lib/constants"
import { useAuth } from "@/components/auth-provider"
import { createClient } from "@/lib/supabase/client"

export default function LandingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()

  const startGame = () => {
    router.push("/game")
  }

  const handleSignIn = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Main */}
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto w-full">
          {/* Hero */}
          <section className="border-b-2 border-foreground">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-10">
              {/* Title */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border-2 border-foreground bg-foreground text-background w-fit px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                    v{APP_VERSION}
                  </span>
                  <span className="border-2 border-foreground bg-card px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-brutal">
                    No sign-in required
                  </span>
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tighter text-foreground leading-[1.05] sm:leading-[1.05] lg:leading-[1] break-words">
                  Master Your{" "}
                  <span className="bg-primary text-primary-foreground px-2 sm:px-3 box-decoration-clone">
                    Typing
                  </span>{" "}
                  Speed
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  Push your typing speed to the limit. Track every keystroke, crush your accuracy, and climb the global leaderboard.
                </p>
              </div>

              {/* Sign-in prompt (guests) or Stats (authenticated) */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {user ? "Your Stats" : "Get Started"}
                </span>
                {user ? (
                  <div className="border-2 border-foreground bg-card p-4 sm:p-6 shadow-brutal">
                    <p className="text-sm font-bold text-muted-foreground">
                      Signed in as <span className="text-foreground">{user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your scores are saved automatically to your account.
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-foreground bg-card p-4 sm:p-6 shadow-brutal flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">
                        Sign in to save scores and track progress
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Guest scores are saved locally in your browser.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSignIn("google")}
                        className="inline-flex items-center gap-1.5 border-2 border-foreground bg-primary text-primary-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Google
                      </button>
                      <button
                        onClick={() => handleSignIn("github")}
                        className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground px-4 py-2 text-[10px] font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        GitHub
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Button
                onClick={startGame}
                className="w-full sm:w-auto h-auto border-2 border-foreground bg-primary text-primary-foreground text-sm sm:text-base font-black uppercase tracking-wide px-6 sm:px-8 py-3 sm:py-4 shadow-brutal-lg hover:translate-x-1 hover:translate-y-1 hover:shadow-brutal transition-brutal"
              >
                Start Typing Test
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </section>

          {/* Leaderboard */}
          <section id="leaderboard">
            <div className="px-4 sm:px-6 lg:px-16 py-10 sm:py-16 flex flex-col items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="border-2 border-foreground bg-primary text-primary-foreground px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Live
                </span>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
                  Global Leaderboard
                </h3>
              </div>
              <Leaderboard />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
