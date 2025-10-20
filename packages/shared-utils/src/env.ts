export function readClientEnv(key: string, fallback = ""): string {
  const v = (typeof window !== "undefined" &&
    (window as any).import?.meta?.env?.[key]) as string | undefined;
  return v ?? fallback;
}

export function readEnv(key: string, fallback = ""): string {
  const client = (typeof window !== "undefined" &&
    (window as any).import?.meta?.env?.[key]) as string | undefined;
  if (client != null) return client;
  if (typeof process !== "undefined" && (process as any).env) {
    const nodeVal = (process as any).env[key] as string | undefined;
    if (nodeVal != null) return nodeVal;
  }
  return fallback;
}
