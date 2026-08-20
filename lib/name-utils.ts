const NAME_SUFFIXES = ["Pro", "Speed", "Ninja", "Turbo", "Ace", "X", "Master", "Go", "God", "Elite", "Blitz", "Rapid"]

export function generateSuggestions(name: string): string[] {
  const shuffled = [...NAME_SUFFIXES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3).map((suffix) => `${name}-${suffix}`)
}
