import { z } from "zod";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

// Environment schema validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("4000").transform(Number),
  API_URL: z.string().url().default("http://localhost:4000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().default("http://localhost:3000").transform((val) => val.split(",")),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Privy Authentication & Wallets
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
  PRIVY_VERIFICATION_KEY: z.string().optional(),
  PRIVY_WALLET_ID: z.string().optional(), // Legacy - use PRIVY_ADMIN_WALLET_ID
  PRIVY_ADMIN_WALLET_ID: z.string().optional(), // Wallet ID for signing mint transactions (from Privy dashboard)

  // Blockchain (Base Chain)
  CHAIN_ID: z.string().default("84532").transform(Number),
  RPC_URL: z.string().url().optional(),
  BLOCKCHAIN_RPC_URL: z.string().url().optional(),
  BLOCKCHAIN_CHAIN_ID: z.string().default("84532").transform(Number),
  BLOCKCHAIN_PRIVATE_KEY: z.string().optional(),
  MINTER_PRIVATE_KEY: z.string().optional(), // Fallback: raw private key for minting (NOT recommended for production)
  NFT_CONTRACT_ADDRESS: z.string().optional(),
  BLOCK_EXPLORER_URL: z.string().url().default("https://sepolia.basescan.org"),
  SEMESTER_NFT_CONTRACT: z.string().optional(),
  DEGREE_NFT_CONTRACT: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default("7d"),

  // College
  COLLEGE_NAME: z.string().default("ABV-IIITM Gwalior"),
  COLLEGE_SHORT_NAME: z.string().default("IIITM"),
  COLLEGE_LOGO_URL: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default("60000").transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default("100").transform(Number),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().default("10").transform(Number),
  UPLOAD_DIR: z.string().default("./uploads"),

  // Email
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => (val ? Number(val) : undefined)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

// Parse and validate environment
const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();

// Type export
export type Env = z.infer<typeof envSchema>;

// Convenience exports
export const isDev = env.NODE_ENV === "development";
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
