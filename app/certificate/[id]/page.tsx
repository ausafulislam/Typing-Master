"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, Download, ShieldCheck } from "lucide-react"
import { CERTIFICATE_TIERS } from "@/lib/constants"
import { verifyCertificate } from "../../actions"

interface CertData {
  id: string
  name: string
  tier: string
  wpm: number
  accuracy: number
  date: string
}

function getTierConfig(tier: string) {
  return CERTIFICATE_TIERS.find((t) => t.name === tier) ?? CERTIFICATE_TIERS[0]
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

const BLUE = "#1E56EA"
const BLUE_LIGHT = "#E8EEFB"

export default function CertificatePage() {
  const params = useParams()
  const router = useRouter()
  const certId = params.id as string
  const [cert, setCert] = useState<CertData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!certId) return
    verifyCertificate(certId).then((res) => {
      if (res) {
        setCert(res as CertData)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    })
  }, [certId])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !cert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center flex flex-col items-center gap-4">
          <ShieldCheck className="w-12 h-12 text-muted-foreground" />
          <h1 className="text-2xl font-black uppercase tracking-tight">Certificate Not Found</h1>
          <p className="text-sm text-muted-foreground">This certificate ID is invalid or does not exist.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 border-2 border-foreground bg-card text-foreground px-4 py-2 text-xs font-black uppercase tracking-widest shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const tier = getTierConfig(cert.tier)

  return (
    <>
      {/* Toolbar - hidden when printing */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 bg-background border-b-2 border-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 border-2 border-foreground bg-card text-foreground text-xs font-black uppercase tracking-widest px-3 py-1.5 shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 border-2 border-foreground bg-primary text-primary-foreground px-5 py-2.5 text-xs font-black uppercase tracking-[0.15em] shadow-brutal hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-brutal"
        >
          <Download className="w-4 h-4" />
          Save as PDF
        </button>
      </div>

      {/* Certificate - landscape layout */}
      <div className="min-h-screen bg-[#f0f0f0] flex items-center justify-center p-4 sm:p-8 print:p-0 print:bg-white pt-20 sm:pt-8 print:pt-0">
        <div className="certificate-wrapper w-full max-w-5xl">
          {/* Outer blue border */}
          <div className="certificate-outer bg-white p-3 sm:p-4 print:p-3" style={{ border: `4px solid ${BLUE}` }}>
            {/* Inner decorative border */}
            <div className="border-2 p-1 sm:p-1.5 print:p-1.5" style={{ borderColor: BLUE }}>
              <div className="border p-6 sm:p-10 print:p-8 lg:p-12" style={{ borderColor: `${BLUE}40` }}>

                {/* Header: Logo + Title */}
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  {/* Logo */}
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/icon.svg" alt="TypeMaster" className="w-12 h-12 sm:w-16 sm:h-16" />
                    <div className="flex flex-col">
                      <span className="text-lg sm:text-xl font-black uppercase tracking-tight" style={{ color: BLUE }}>TypeMaster</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Typing Speed Certification</span>
                    </div>
                  </div>

                  {/* Tier badge */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="px-4 sm:px-6 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-black uppercase tracking-widest"
                      style={{ backgroundColor: BLUE }}
                    >
                      {tier.label} Certificate
                    </div>
                  </div>
                </div>

                {/* Decorative top line */}
                <div className="w-full h-0.5 mb-6 sm:mb-8" style={{ backgroundColor: BLUE }} />

                {/* Main content */}
                <div className="flex flex-col items-center gap-4 sm:gap-6 text-center">

                  {/* Subtitle */}
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">This is to certify that</span>

                  {/* Player Name */}
                  <div className="flex flex-col items-center gap-2">
                    <h1
                      className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight"
                      style={{ color: BLUE, fontFamily: "Georgia, serif" }}
                    >
                      {cert.name}
                    </h1>
                    <div className="w-48 sm:w-72 h-0.5" style={{ backgroundColor: `${BLUE}40` }} />
                  </div>

                  {/* Achievement */}
                  <div className="flex flex-col items-center gap-2 text-center max-w-xl">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">has successfully demonstrated</span>
                    <p className="text-sm sm:text-base font-bold text-gray-600 leading-relaxed">
                      A typing speed of <span className="font-black text-black">{cert.wpm} words per minute</span> with{" "}
                      <span className="font-black text-black">{cert.accuracy}% accuracy</span>
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 sm:gap-10 mt-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl sm:text-4xl font-black" style={{ color: BLUE }}>{cert.wpm}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">WPM</span>
                    </div>
                    <div className="w-px h-8 sm:h-10" style={{ backgroundColor: `${BLUE}30` }} />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl sm:text-4xl font-black" style={{ color: BLUE }}>{cert.accuracy}%</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Accuracy</span>
                    </div>
                    <div className="w-px h-8 sm:h-10" style={{ backgroundColor: `${BLUE}30` }} />
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm sm:text-lg font-black text-black">{formatDate(cert.date)}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Date Earned</span>
                    </div>
                  </div>
                </div>

                {/* Bottom decorative line */}
                <div className="w-full h-0.5 mt-6 sm:mb-8" style={{ backgroundColor: BLUE }} />

                {/* Footer */}
                <div className="flex items-end justify-between mt-4 sm:mt-6">
                  {/* Signature */}
                  <div className="flex flex-col items-center gap-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/authority-signature.png" alt="Authority Signature" className="h-10 sm:h-14 object-contain" />
                    <div className="w-32 sm:w-44 h-px bg-gray-300" />
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">TypeMaster Authority</span>
                  </div>

                  {/* Certificate ID */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-500">{cert.id}</span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Certificate ID</span>
                  </div>

                  {/* Verify link */}
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] sm:text-xs font-bold" style={{ color: BLUE }}>typemaster-x.vercel.app/verify</span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Verify Online</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate-wrapper {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          .certificate-outer {
            box-shadow: none !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
        }
      `}</style>
    </>
  )
}
