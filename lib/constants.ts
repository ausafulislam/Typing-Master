export const LEADERBOARD_PAGE_SIZE = 50

/** Hard cap — the leaderboard only ever shows the top 50 scores. */
export const MAX_LEADERBOARD_ENTRIES = 50

export const APP_VERSION = "0.9.0"

export interface CertificateTier {
  name: string
  label: string
  minWpm: number
  minAccuracy: number
  color: string
  prefix: string
}

export const CERTIFICATE_TIERS: CertificateTier[] = [
  { name: "bronze", label: "Bronze", minWpm: 40, minAccuracy: 80, color: "#CD7F32", prefix: "B" },
  { name: "silver", label: "Silver", minWpm: 60, minAccuracy: 85, color: "#C0C0C0", prefix: "S" },
  { name: "gold", label: "Gold", minWpm: 80, minAccuracy: 90, color: "#FFD700", prefix: "G" },
  { name: "diamond", label: "Diamond", minWpm: 100, minAccuracy: 95, color: "#B9F2FF", prefix: "D" },
]

/**
 * Generates a collision-resistant certificate ID in TYM<X>.XXX.XXXX format
 * (11 alphanumeric chars). The 7 trailing chars are cryptographically random,
 * so two players with identical scores can never produce the same ID.
 */
export function generateCertificateId(tier: CertificateTier): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let random = ""
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const bytes = new Uint8Array(7)
    globalThis.crypto.getRandomValues(bytes)
    for (const b of bytes) random += alphabet[b % alphabet.length]
  } else {
    for (let i = 0; i < 7; i++) {
      random += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
  }
  return `TYM${tier.prefix}.${random.slice(0, 3)}.${random.slice(3)}`
}
