"use client"

import * as React from "react"

/**
 * Hook for responsive breakpoint detection
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 768px)')
 * const isDesktop = useMediaQuery('(min-width: 1024px)')
 * 
 * return isMobile ? <MobileNav /> : <DesktopNav />
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }

    // Fallback for older browsers
    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }, [query])

  // Return false during SSR
  return mounted ? matches : false
}

/**
 * Predefined breakpoint hooks
 */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}

export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1023px)")
}

export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)")
}
