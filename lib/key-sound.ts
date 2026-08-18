// Synthesized mechanical keyboard sound using the Web Audio API.
// No audio files required — generates a short "thock" + high-frequency clack.

let ctx: AudioContext | null = null
let closeTimeout: ReturnType<typeof setTimeout> | null = null
const bufferCache = new Map<string, AudioBuffer>()

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  return ctx
}

function scheduleClose(audio: AudioContext) {
  if (closeTimeout) clearTimeout(closeTimeout)
  closeTimeout = setTimeout(() => {
    audio.close().catch(() => {})
    ctx = null
    bufferCache.clear()
  }, 30000)
}

function getNoiseBuffer(audio: AudioContext, variant: KeyVariant): AudioBuffer {
  const cacheKey = `${variant}-${audio.sampleRate}`
  const cached = bufferCache.get(cacheKey)
  if (cached) return cached

  const bufferSize = Math.floor(audio.sampleRate * 0.03)
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3)
  }
  bufferCache.set(cacheKey, buffer)
  return buffer
}

export type KeyVariant = "key" | "space" | "error"

export function playKeySound(variant: KeyVariant = "key") {
  const audio = getContext()
  if (!audio) return

  if (audio.state === "suspended") {
    audio.resume().catch(() => {})
  }

  scheduleClose(audio)

  const t = audio.currentTime

  // --- High-frequency "clack" (filtered noise burst) ---
  const buffer = getNoiseBuffer(audio, variant)
  const noise = audio.createBufferSource()
  noise.buffer = buffer

  const noiseFilter = audio.createBiquadFilter()
  noiseFilter.type = "bandpass"
  noiseFilter.frequency.value = variant === "space" ? 1000 : 1900
  noiseFilter.Q.value = 0.9

  const noiseGain = audio.createGain()
  const clackLevel = variant === "error" ? 0.16 : 0.1
  noiseGain.gain.setValueAtTime(clackLevel, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03)

  noise.connect(noiseFilter).connect(noiseGain).connect(audio.destination)
  noise.start(t)
  noise.stop(t + 0.03)

  // --- Low-frequency "thock" (pitch-dropping triangle) ---
  const osc = audio.createOscillator()
  osc.type = "triangle"
  const startFreq = variant === "space" ? 130 : variant === "error" ? 220 : 190
  osc.frequency.setValueAtTime(startFreq, t)
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.05)

  const oscGain = audio.createGain()
  oscGain.gain.setValueAtTime(0.14, t)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06)

  osc.connect(oscGain).connect(audio.destination)
  osc.start(t)
  osc.stop(t + 0.07)
}
