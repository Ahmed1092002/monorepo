import { readEnv } from "../env";

const API_BASE_URL = readEnv("VITE_API_BASE_URL", "");

function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit
): Promise<T> {
  const url = toAbsoluteUrl(path);
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init?.body ? { "Content-Type": "application/json" } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Request failed ${res.status} ${res.statusText}${text ? ": " + text : ""}`
    );
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as T;
}

export const apiClient = {
  get: <T>(path: string, token?: string) =>
    request<T>(path, token, { method: "GET" }),
  post: <T, B = unknown>(path: string, body?: B, token?: string) =>
    request<T>(path, token, {
      method: "POST",
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  put: <T, B = unknown>(path: string, body?: B, token?: string) =>
    request<T>(path, token, {
      method: "PUT",
      body: body != null ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, token?: string) =>
    request<T>(path, token, { method: "DELETE" }),
};

export type ApiClient = typeof apiClient;
