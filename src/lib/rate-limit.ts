import type { NextRequest } from "next/server";

type Bucket = { count: number; resetAt: number };
const BUCKETS = new Map<string, Bucket>();

// IP do cliente atrás do CDN/Edge
export function getClientIP(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = (fwd?.split(",")[0] || req.ip || "").trim();
  return ip || "0.0.0.0";
}

// Limitador simples em memória (adequado para verificação SMS)
export async function tooMany(key: string, max = 6, windowMs = 60_000): Promise<boolean> {
  const now = Date.now();
  const b = BUCKETS.get(key);
  if (!b || b.resetAt < now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  if (b.count > max) return true;
  return false;
}

// Cooldown por recurso (ex.: reenvio de código)
export function checkCooldown(key: string, cooldownMs: number): boolean {
  const now = Date.now();
  const b = BUCKETS.get(key);
  if (!b || b.resetAt < now) return false;
  // usamos resetAt como fim do cooldown
  return true;
}

export function startCooldown(key: string, cooldownMs: number) {
  BUCKETS.set(key, { count: 0, resetAt: Date.now() + cooldownMs });
}
