export function getEnv(name: string): string | undefined {
  return process.env[name];
}

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

/** Read an optional server environment variable. */
export function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

/** True only when running inside the hosted Grok preview environment. */
export function isWorkspacePreview(): boolean {
  const host = env("VITE_PUBLIC_HOSTNAME") ?? env("VERCEL_URL") ?? "";
  return host.endsWith(".grok-sandbox.com") || host.endsWith(".app-builder-testing.com");
}
