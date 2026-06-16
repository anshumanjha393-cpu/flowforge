import session from "express-session";
import { RedisStore } from "connect-redis";
import { redis, isRedisAvailable } from "./redis.js";

const sessionSecret = process.env.SESSION_SECRET || "flowforge_session_secret_change_me";

export const getSessionMiddleware = () => {
  const cookieMaxAge = 21 * 24 * 60 * 60 * 1000; // 21 days in milliseconds

  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: cookieMaxAge,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  if (isRedisAvailable && redis) {
    try {
      const store = new RedisStore({
        client: redis,
        prefix: "flowforge_sess:",
      });
      sessionConfig.store = store;
      console.log("Session middleware: Using RedisStore");
    } catch (err) {
      console.warn("Failed to create RedisStore, falling back to MemoryStore:", err);
    }
  } else {
    console.log("Session middleware: Using MemoryStore");
  }

  return session(sessionConfig);
};
