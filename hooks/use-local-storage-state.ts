"use client"

import { useCallback, useSyncExternalStore } from "react"

type Listener = () => void

// Shared across every hook instance so a write notifies all consumers of that key.
const listeners = new Set<Listener>()

function emit(): void {
  listeners.forEach((listener) => listener())
}

/**
 * Reads/writes a localStorage key as React state via useSyncExternalStore.
 * Server/hydration renders the fallback; the stored value appears right after
 * hydration without setState-in-effect cascades. Cross-tab changes sync via
 * the storage event.
 */
export function useLocalStorageState(key: string, fallback: string) {
  const subscribe = useCallback(
    (onStoreChange: Listener) => {
      listeners.add(onStoreChange)
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onStoreChange()
      }
      window.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(onStoreChange)
        window.removeEventListener("storage", onStorage)
      }
    },
    [key],
  )

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  }, [key, fallback])

  const getServerSnapshot = useCallback(() => fallback, [fallback])

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const setValue = useCallback(
    (next: string) => {
      try {
        localStorage.setItem(key, next)
      } catch {
        // Storage full/unavailable — still notify so the UI stays consistent in-session
      }
      emit()
    },
    [key],
  )

  return [value, setValue] as const
}
