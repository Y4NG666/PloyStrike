const DEFAULT_API_BASE = "http://localhost:3001";

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE;

export function getWsUrl() {
  const base = apiBaseUrl.replace(/^http/, "ws");
  return `${base}/ws`;
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = path.startsWith("http") ? path : `${apiBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
