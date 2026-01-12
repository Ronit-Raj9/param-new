import { Redis } from "ioredis";

async function test() {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    console.log(`Connecting to ${url}...`);
    const redis = new Redis(url);
    try {
        const res = await redis.ping();
        console.log("Redis PING success:", res);
        process.exit(0);
    } catch (err) {
        console.error("Redis connection failed:", err);
        process.exit(1);
    }
}
test();
