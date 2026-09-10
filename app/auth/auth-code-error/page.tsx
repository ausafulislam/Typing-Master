import { Keyboard } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-card border-2 border-foreground shadow-brutal-lg p-8 flex flex-col items-center gap-6 text-center">
        <div className="bg-foreground text-background p-3">
          <Keyboard className="w-10 h-10" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
            Sign-in Failed
          </h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            We couldn&apos;t complete the sign-in. This can happen if the link expired or
            was opened twice. Please try signing in again.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}