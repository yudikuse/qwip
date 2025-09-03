// src/lib/rate-limit.ts
// Rate limit / cooldown lightweight (memória do server). Funciona em Vercel SSR/Edge.
// Para produção multi-região perfeita, depois trocamos os Maps por Redis/KV (Upstash).

import type { NextRequest } from 'next/server';

type Bucket = { count: number; resetAt: number };
type Cooldown = { until: number };

const buckets = new Map<string, Bucket>();
const cooldowns = new Map<string, Cooldown>();
const daily = new Map<string, Bucket>(); // “teto diário” por telefone

function now() { return Date.now(); }
function key(ip: string, name: string) { return `ip:${ip}:${name}`; }
function phoneKey(phone: string, name: string) { return `phone:${phone}:${name}`; }

/** Extrai IP do request (Vercel/Proxy) */
export function getClientIP(req: NextRequest): string {
  // Next 13+ (Edge): req.ip pode existir
  const ip = (req as any).ip as string | undefined;
  if (ip) return ip;

  const xf = req.headers.get('x-forwarded-for');
  if (xf) return xf.split(',')[0].trim();
  const xr = req.headers.get('x-real-ip');
  if (xr) return xr;
  return '0.0.0.0';
}

/** Token bucket simples */
export function limitByKey(k: string, max: number, windowSec: number) {
  const ts = now();
  const b = buckets.get(k);
  if (!b || ts >= b.resetAt) {
    buckets.set(k, { count: 1, resetAt: ts + windowSec * 1000 });
    return { ok: true, remaining: max - 1, retryAfterSec: 0 };
  }
  if (b.count < max) {
    b.count++;
    return { ok: true, remaining: max - b.count, retryAfterSec: Math.ceil((b.resetAt - ts) / 1000) };
  }
  return { ok: false, remaining: 0, retryAfterSec: Math.ceil((b.resetAt - ts) / 1000) };
}

/** Cooldown por chave (ex.: 60s entre envios) */
export function checkCooldown(k: string, seconds: number) {
  const ts = now();
  const c = cooldowns.get(k);
  if (c && ts < c.until) {
    return { ok: false, retryAfterSec: Math.ceil((c.until - ts) / 1000) };
  }
  cooldowns.set(k, { until: ts + seconds * 1000 });
  return { ok: true, retryAfterSec: 0 };
}

/** Teto diário por telefone (ex.: 10 SMS/dia) */
export function dailyCap(phone: string, cap: number) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const resetAt = day.getTime() + 24 * 60 * 60 * 1000;

  const k = phoneKey(phone, 'daycap');
  const b = daily.get(k);
  const ts = now();

  if (!b || ts >= b.resetAt) {
    daily.set(k, { count: 1, resetAt });
    return { ok: true, remaining: cap - 1 };
  }
  if (b.count < cap) {
    b.count++;
    return { ok: true, remaining: cap - b.count };
  }
  return { ok: false, remaining: 0 };
}

/** Helpers de resposta 429 */
export function tooMany(message: string, retryAfterSec: number) {
  return new Response(JSON.stringify({ error: message, retryAfterSec }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Retry-After': String(retryAfterSec),
      'Cache-Control': 'no-store',
    },
  });
}
