"use client"

import * as React from "react"

/**
 * Hook for localStorage with SSR safety
 * 
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage('theme', 'light')
 * 
 * <Button onClick={() => setTheme('dark')}>
 *   Switch to Dark Mode
 * </Button>
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function
  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value

        setStoredValue(valueToStore)

        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Remove from localStorage
  const remove = React.useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
        setStoredValue(initialValue)
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, remove]
}
