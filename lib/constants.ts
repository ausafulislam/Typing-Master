export const LEADERBOARD_PAGE_SIZE = 50

/** Hard cap — the leaderboard only ever shows the top 50 scores. */
export const MAX_LEADERBOARD_ENTRIES = 50

export const APP_VERSION = "0.11.1"

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

export function getTierConfig(tier: string): CertificateTier {
  return CERTIFICATE_TIERS.find((t) => t.name === tier) ?? CERTIFICATE_TIERS[0]
}
