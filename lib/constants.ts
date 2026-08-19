export const LEADERBOARD_PAGE_SIZE = 15

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

export function generateCertificateId(tier: CertificateTier, wpm: number, accuracy: number): string {
  const toBase36 = (n: number) => n.toString(36).toUpperCase().padStart(3, "0")
  const group1 = `TYM${tier.prefix}`
  const group2 = toBase36(wpm).slice(0, 4)
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "")
  const group3 = (toBase36(Math.round(accuracy * 10)) + rand).slice(0, 4)
  return `${group1}.${group2}.${group3}`
}
