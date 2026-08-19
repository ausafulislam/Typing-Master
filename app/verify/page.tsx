"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Keyboard, ShieldCheck, ShieldX, Loader2 } from "lucide-react"
import { verifyCertificate } from "../actions"
import { CERTIFICATE_TIERS } from "@/lib/constants"

interface VerifyResult {
  valid: boolean
  id: string
  name: string
  tier: string
  wpm: number
  accuracy: number
  date: string
}

function getTierColor(tier: string): string {
  const t = CERTIFICATE_TIERS.find((ct) => ct.name === tier)
  return t?.color ?? "#888"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function VerifyPage() {
  const [input, setInput] = useState("")
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [hasChecked, setHasChecked] = useState(false)

  const formatInput = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 12)
    const parts: string[] = []
    if (cleaned.length > 0) parts.push(cleaned.slice(0, 4))
    if (cleaned.length > 4) parts.push(cleaned.slice(4, 8))
    if (cleaned.length > 8) parts.push(cleaned.slice(8, 12))
    return parts.join(".")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(formatInput(e.target.value))
    setResult(null)
    setNotFound(false)
    setHasChecked(false)
  }

  const handleVerify = async () => {
    const cleanId = input.replace(/\./g, "").trim()
    if (cleanId.length < 4) return

    setChecking(true)
    setResult(null)
    setNotFound(false)
    setHasChecked(true)

    try {
      const res = await verifyCertificate(input)
      if (res) {
        setResult(res)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setChecking(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleVerify()
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="border-2 border-foreground bg-card p-2.5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">Verify Certificate</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground border-2 border-foreground shadow-brutal p-1.5 sm:p-2">
              <Keyboard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-base sm:text-xl font-black uppercase tracking-tight text-foreground">TypeMaster</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg flex flex-col gap-8">
          {/* Title */}
          <div className="flex flex-col gap-3 text-center">
            <div className="flex justify-center">
              <div className="bg-foreground text-background p-3">
                <ShieldCheck className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
              Certificate Verification
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter a certificate ID to verify its authenticity. Certificate IDs follow the format: TYM.X.XXX.XXX
            </p>
          </div>

          {/* Input */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                autoFocus
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="TYM.X.XXX.XXX"
                aria-label="Certificate ID"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 h-12 border-2 border-foreground bg-card px-4 text-center text-lg font-mono font-bold shadow-brutal focus-visible:ring-0 focus-visible:border-primary uppercase"
              />
              <button
                onClick={handleVerify}
                disabled={checking || input.replace(/\./g, "").length < 4}
                className="h-12 px-6 border-2 border-foreground bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal disabled:opacity-40"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </button>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="border-2 border-foreground bg-card p-6 shadow-brutal flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-green-600" />
                <span className="text-sm font-black uppercase tracking-widest text-green-600">Valid Certificate</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Player</span>
                  <span className="text-sm font-black text-foreground">{result.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tier</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-foreground" style={{ backgroundColor: getTierColor(result.tier) }} />
                    <span className="text-sm font-black uppercase tracking-widest text-foreground">{result.tier}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WPM</span>
                  <span className="text-sm font-black font-mono text-primary">{result.wpm}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accuracy</span>
                  <span className="text-sm font-black font-mono text-foreground">{result.accuracy}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</span>
                  <span className="text-sm font-bold text-muted-foreground">{formatDate(result.date)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-foreground/10 pt-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Certificate ID</span>
                  <code className="text-sm font-mono font-bold text-primary">{result.id}</code>
                </div>
              </div>
            </div>
          )}

          {notFound && hasChecked && !checking && (
            <div className="border-2 border-foreground bg-card p-6 shadow-brutal flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <ShieldX className="w-6 h-6 text-destructive" />
                <span className="text-sm font-black uppercase tracking-widest text-destructive">Invalid Certificate</span>
              </div>
              <p className="text-sm text-muted-foreground">
                No certificate found with this ID. Please check the ID and try again.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-foreground bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground border-2 border-foreground p-1">
              <Keyboard className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs sm:text-sm font-black uppercase tracking-tight">TypeMaster</span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            &copy; 2026 Ausaf Ul Islam
          </p>
        </div>
      </footer>
    </div>
  )
}
