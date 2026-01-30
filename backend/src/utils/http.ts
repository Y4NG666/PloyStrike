import fetch, { RequestInit } from "node-fetch";
import { env } from "../config/env.js";

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(minMs: number, maxMs: number): number {
  const range = Math.max(maxMs - minMs, 0);
  return minMs + Math.floor(Math.random() * (range + 1));
}

async function withRetry<T>(
  task: () => Promise<T>,
  attempts = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        const delay = baseDelayMs * attempt + jitter(0, baseDelayMs);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export async function fetchJson<T>(
  url: string,
  options?: RequestInit,
  attempts = 3
): Promise<T> {
  return withRetry(async () => {
    await sleep(jitter(env.requestMinDelayMs, env.requestMaxDelayMs));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 PolyStrikeBot/1.0",
        ...options?.headers
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as T;
  }, attempts);
}

export async function fetchText(
  url: string,
  options?: RequestInit,
  attempts = 3
): Promise<string> {
  return withRetry(async () => {
    await sleep(jitter(env.requestMinDelayMs, env.requestMaxDelayMs));
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 PolyStrikeBot/1.0",
        ...options?.headers
      }
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }, attempts);
}
