import Redis from "ioredis";
import { env } from "./env.js";

// Redis client singleton
let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error("❌ Redis connection failed after 3 retries");
          return null;
        }
        return Math.min(times * 200, 2000);
      },
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    redisClient.on("error", (error) => {
      console.error("❌ Redis error:", error.message);
    });
  }

  return redisClient;
}

// Connection test
export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  try {
    await client.ping();
    console.log("✅ Redis ping successful");
  } catch (error) {
    console.error("❌ Redis connection failed:", error);
    // Don't exit - Redis might be optional for some features
  }
}

// Graceful shutdown
export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("📴 Redis disconnected");
  }
}

// Export redis client for direct use
export const redis = getRedisClient();

// Export for BullMQ workers - use redisConnection instead of redis instance
// BullMQ needs its own internal ioredis version
export const redisConnection = {
  host: new URL(env.REDIS_URL).hostname || "localhost",
  port: parseInt(new URL(env.REDIS_URL).port || "6379"),
};
