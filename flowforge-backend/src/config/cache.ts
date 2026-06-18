// @ts-nocheck
import { redis, isRedisAvailable } from "./redis.js";

const DEFAULT_TTL = 300; // 5 minutes

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable || !redis) return null;
    try {
      const data = await redis.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttl = DEFAULT_TTL): Promise<void> {
    if (!isRedisAvailable || !redis) return;
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttl);
    } catch {
      // silently fail
    }
  },

  async del(pattern: string): Promise<void> {
    if (!isRedisAvailable || !redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch {
      // silently fail
    }
  },

  async invalidateProject(projectId: string): Promise<void> {
    await this.del(`cache:projects:*`);
    await this.del(`cache:tasks:${projectId}:*`);
  },

  async invalidateTasks(projectId?: string): Promise<void> {
    if (projectId) {
      await this.del(`cache:tasks:${projectId}:*`);
    }
    await this.del(`cache:tasks:*`);
  },
};
