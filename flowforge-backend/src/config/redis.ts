import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;
let isRedisAvailable = false;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        // Stop retrying after 3 attempts
        isRedisAvailable = false;
        console.warn("Redis connection failed. Falling back to in-memory storage.");
        return null;
      }
      return Math.min(times * 100, 2000);
    },
  });

  redis.on("connect", () => {
    isRedisAvailable = true;
    console.log("Redis client connected successfully.");
  });

  redis.on("error", (err) => {
    isRedisAvailable = false;
    console.warn("Redis error:", err.message);
  });
} catch (error) {
  console.warn("Failed to initialize Redis client. Falling back to in-memory storage.");
}

export { redis, isRedisAvailable };
