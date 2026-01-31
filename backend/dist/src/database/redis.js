import Redis from "ioredis";
import { env } from "../config/env.js";
export const redis = env.redisUrl ? new Redis(env.redisUrl) : null;
