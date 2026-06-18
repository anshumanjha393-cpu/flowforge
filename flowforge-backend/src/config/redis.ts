// @ts-nocheck
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

let redis: InstanceType<typeof Redis> | null = null;
let isRedisAvailable = false;
let redisErrorLogged = false;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy(times: number) {
      if (times > 3) {
        isRedisAvailable = false;
        if (!redisErrorLogged) {
          console.warn("Redis connection failed. Falling back to in-memory storage.");
          redisErrorLogged = true;
        }
        return null;
      }
      return Math.min(times * 100, 2000);
    },
    lazyConnect: true,
  });

  redis.on("connect", () => {
    isRedisAvailable = true;
    console.log("Redis client connected successfully.");
  });

  redis.on("error", (err: Error) => {
    isRedisAvailable = false;
    if (!redisErrorLogged && err.message) {
      console.warn("Redis error:", err.message);
      redisErrorLogged = true;
    }
  });

  redis.connect().catch(() => {});
} catch (error) {
  console.warn("Failed to initialize Redis client. Falling back to in-memory storage.");
}

export { redis, isRedisAvailable };
