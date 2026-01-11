"use client"

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth"
import { privyConfig } from "@/lib/privy-config"

interface PrivyProviderProps {
  children: React.ReactNode
}

export function PrivyProvider({ children }: PrivyProviderProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID

  if (!appId) {
    console.error("NEXT_PUBLIC_PRIVY_APP_ID is not set")
    return <>{children}</>
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={privyConfig}
    >
      {children}
    </PrivyProviderBase>
  )
}
