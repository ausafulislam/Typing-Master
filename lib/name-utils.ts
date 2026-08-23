const NAME_SUFFIXES = ["Pro", "Speed", "Ninja", "Turbo", "Ace", "X", "Master", "Go", "God", "Elite", "Blitz", "Rapid"]

export const MAX_NAME_LENGTH = 20

/**
 * Strips control characters and HTML tags, trims whitespace.
 * Shared by client (localStorage persistence) and server (validation)
 * so stored names always match what's in the database.
 */
export function sanitizeName(name: string): string {
  return name
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
}

export function generateSuggestions(name: string): string[] {
  const shuffled = [...NAME_SUFFIXES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((suffix) => `${name}-${suffix}`)
}
