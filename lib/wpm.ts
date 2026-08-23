// Pure typing-metric calculations — no React, no DOM, independently testable.

/**
 * Standard gross WPM: characters typed ÷ 5 (avg word length) per minute.
 */
export function calculateWpm(charactersTyped: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0
  return Math.round(charactersTyped / 5 / (elapsedSeconds / 60))
}

/**
 * Keystroke accuracy as a percentage with 1 decimal place.
 * Returns 100 when nothing has been typed yet.
 */
export function calculateAccuracy(totalTyped: number, errors: number): number {
  if (totalTyped <= 0) return 100
  return Math.round(((totalTyped - errors) / totalTyped) * 100 * 10) / 10
}

/**
 * Completion percentage through the sample text, capped at 100.
 */
export function calculateProgress(currentIndex: number, totalLength: number): number {
  if (totalLength <= 0) return 0
  return Math.min(100, Math.round((currentIndex / totalLength) * 100))
}
