"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Game page error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
        <div className="bg-destructive text-destructive-foreground p-3">
          <span className="text-3xl font-black">!</span>
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            The typing game hit an unexpected error. You can try again or go back to the home page.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="h-11 gap-2 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Button>
          <a
            href="/"
            className="h-11 inline-flex items-center gap-2 border-2 border-foreground bg-card text-foreground font-black uppercase px-4 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  )
}
