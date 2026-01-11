/**
 * Privy authentication configuration
 * Configure Privy SDK for the application
 */

import type { PrivyClientConfig } from "@privy-io/react-auth"

export const privyConfig: PrivyClientConfig = {
  // Appearance
  appearance: {
    theme: "light",
    accentColor: "#0b3d91",
    logo: "/placeholder-logo.svg",
    
    showWalletLoginFirst: false,
    
    loginMessage: "Login to PARAM Academic Portal",
    
    walletChainType: "ethereum-only",
  },

  // Login methods
  loginMethods: ["email", "google"],
  
  // Email login configuration
  embeddedWallets: {
    createOnLogin: "off", // Don't create wallets for students
    requireUserPasswordOnCreate: false,
  },

  // Supported chains (for future blockchain interactions)
  supportedChains: [
    // Ethereum Mainnet
    {
      id: 1,
      name: "Ethereum",
      network: "mainnet",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://eth.llamarpc.com"],
        },
        public: {
          http: ["https://eth.llamarpc.com"],
        },
      },
    },
    // Base Mainnet
    {
      id: 8453,
      name: "Base",
      network: "base",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://mainnet.base.org"],
        },
        public: {
          http: ["https://mainnet.base.org"],
        },
      },
    },
    // Base Sepolia Testnet
    {
      id: 84532,
      name: "Base Sepolia",
      network: "base-sepolia",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://sepolia.base.org"],
        },
        public: {
          http: ["https://sepolia.base.org"],
        },
      },
    },
    // Sepolia Testnet
    {
      id: 11155111,
      name: "Sepolia",
      network: "sepolia",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ["https://rpc.sepolia.org"],
        },
        public: {
          http: ["https://rpc.sepolia.org"],
        },
      },
    },
  ],

  // Legal and privacy links
  legal: {
    termsAndConditionsUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/terms`,
    privacyPolicyUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/privacy`,
  },
}

/**
 * Default authentication config
 */
export const authConfig = {
  // Session timeout (in milliseconds)
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

  // Allowed email domains (empty array = all domains allowed)
  allowedEmailDomains: [],

  // OAuth providers
  oauthProviders: {
    google: {
      enabled: true,
      scope: ["email", "profile"],
    },
  },

  // MFA/2FA settings (future)
  mfa: {
    enabled: false,
    enforceForRoles: ["ADMIN"],
  },
}

/**
 * Validate email domain
 */
export function isValidInstitutionalEmail(email: string): boolean {
  // If no domains specified, allow all
  if (authConfig.allowedEmailDomains.length === 0) return true
  
  const domain = email.split("@")[1]?.toLowerCase()
  return authConfig.allowedEmailDomains.includes(domain)
}
