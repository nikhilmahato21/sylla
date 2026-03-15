import Redis from "ioredis";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => console.error("❌ Redis error:", err.message));
  }
  return redisClient;
}

export const redis = getRedisClient();
