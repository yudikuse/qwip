// src/lib/session.ts
// Sessão via cookie HttpOnly assinado (formato: v1.<payload>.<sig>)
// Compatível com o middleware.ts e com imports legados:
//   - verifySessionValue(token)
//   - issueSession(...)

import type { NextResponse } from "next/server";

// ===== Config =====
export const COOKIE_NAME = "qwip_session";
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

function getSigningSecret(): string {
  const s =
    process.env.SIGNING_SECRET ||
    process.env.QWIP_SIGNING_SECRET ||
    "dev-secret-change-me";
  return s && s.length >= 16 ? s : "dev-secret-change-me";
}

// ===== Helpers base64/url (Node/Edge-safe) =====
function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function dec(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}
function bytesToB64(u8: Uint8Array): string {
  if (typeof btoa !== "undefined") {
    let s = "";
    for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
    // eslint-disable-next-line no-undef
    return btoa(s);
  }
  // @ts-ignore Node
  return Buffer.from(u8).toString("base64");
}
function b64ToBytes(b64: string): Uint8Array {
  if (typeof atob !== "undefined") {
    // eslint-disable-next-line no-undef
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // @ts-ignore Node
  return new Uint8Array(Buffer.from(b64, "base64"));
}
function b64ToB64u(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64uToB64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}
// Converte Uint8Array -> ArrayBuffer “puro” (evita SharedArrayBuffer)
function u8ToPureArrayBuffer(u8: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(u8.byteLength);
  new Uint8Array(buf).set(u8);
  return buf;
}

// ===== Tipos =====
export type SessionClaims = {
  phone: string; // E.164 (ex: +5599999999999)
  iat: number;   // epoch seconds
  exp: number;   // epoch seconds
};

// ===== HMAC-SHA256 (WebCrypto) =====
async function hmacSha256(keyBytes: Uint8Array, dataBytes: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    u8ToPureArrayBuffer(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, u8ToPureArrayBuffer(dataBytes));
  return new Uint8Array(sig);
}

// ===== Token (v1.<payloadB64u>.<sigB64u>) =====
function encodeClaims(claims: SessionClaims): string {
  const json = JSON.stringify(claims);
  const b64 = bytesToB64(enc(json));
  return b64ToB64u(b64);
}

function decodeClaims(payloadB64u: string): SessionClaims {
  const json = dec(b64ToBytes(b64uToB64(payloadB64u)));
  return JSON.parse(json) as SessionClaims;
}

export async function createSessionToken(
  params: { phone: string; ttlSeconds?: number }
): Promise<string> {
  const { phone, ttlSeconds = DEFAULT_TTL_SECONDS } = params;
  const now = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    phone,
    iat: now,
    exp: now + Math.max(60, ttlSeconds),
  };
  const payloadB64u = encodeClaims(claims);
  const toSign = `v1.${payloadB64u}`;
  const sig = await hmacSha256(enc(getSigningSecret()), enc(toSign));
  const sigB64u = b64ToB64u(bytesToB64(sig));
  return `v1.${payloadB64u}.${sigB64u}`;
}

export async function verifySessionToken(
  token: string | null
): Promise<{ ok: boolean; claims?: SessionClaims; reason?: string }> {
  if (!token) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  const [ver, payloadB64u, sigB64u] = parts;
  if (ver !== "v1") return { ok: false, reason: "version" };

  let claims: SessionClaims;
  try {
    claims = decodeClaims(payloadB64u);
  } catch {
    return { ok: false, reason: "payload" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || claims.exp <= now) {
    return { ok: false, reason: "expired" };
  }

  const toSign = `v1.${payloadB64u}`;
  const expected = await hmacSha256(enc(getSigningSecret()), enc(toSign));
  const got = b64ToBytes(b64uToB64(sigB64u));

  if (!timingSafeEqual(expected, got)) return { ok: false, reason: "signature" };
  return { ok: true, claims };
}

// Comparação constante
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a[i] ^ b[i];
  return v === 0;
}

// ===== Cookies HttpOnly =====
export function setSessionCookie(
  res: NextResponse,
  token: string,
  opts?: { maxAgeSeconds?: number }
) {
  const maxAge = opts?.maxAgeSeconds ?? DEFAULT_TTL_SECONDS;
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

// Helper para pegar claims dentro de rota (Node/Edge)
export async function getSessionFromRequest(
  req: { cookies?: { get: (name: string) => { value: string } | undefined } }
): Promise<{ ok: boolean; claims?: SessionClaims; reason?: string }> {
  const raw = req.cookies?.get(COOKIE_NAME)?.value ?? null;
  return verifySessionToken(raw);
}

// =========================
// ====== ALIASES =========
// =========================

// Compat: alguns arquivos importam verifySessionValue(token)
export async function verifySessionValue(
  token: string | null
): Promise<{ ok: boolean; claims?: SessionClaims; reason?: string }> {
  return verifySessionToken(token);
}

// --------- issueSession: sobrecargas para legado ----------
// Suporta chamadas:
//   issueSession(phone)                                   -> retorna token
//   issueSession(phone, 24)                               -> 24 horas de TTL, retorna token
//   issueSession(phone, res)                              -> define cookie e retorna token
//   issueSession(phone, 24, res)                          -> TTL horas + define cookie
//   issueSession({ phone, ttlSeconds?, res? })            -> estilo objeto

export async function issueSession(phone: string): Promise<string>;
export async function issueSession(phone: string, ttlHours: number): Promise<string>;
export async function issueSession(phone: string, res: NextResponse): Promise<string>;
export async function issueSession(phone: string, ttlHours: number, res: NextResponse): Promise<string>;
export async function issueSession(opts: { phone: string; ttlSeconds?: number; res?: NextResponse }): Promise<string>;
export async function issueSession(
  arg1: string | { phone: string; ttlSeconds?: number; res?: NextResponse },
  arg2?: number | NextResponse,
  arg3?: NextResponse
): Promise<string> {
  // Normaliza parâmetros
  let phone: string;
  let ttlSeconds: number | undefined;
  let res: NextResponse | undefined;

  if (typeof arg1 === "string") {
    phone = arg1;
    if (typeof arg2 === "number") {
      // Se o número for pequeno, tratamos como HORAS (legado: 24 = 24h)
      ttlSeconds = arg2 > 1000 ? Math.floor(arg2) : Math.floor(arg2 * 3600);
      res = arg3;
    } else if (arg2) {
      res = arg2 as NextResponse;
    }
  } else {
    phone = arg1.phone;
    ttlSeconds = arg1.ttlSeconds;
    res = arg1.res;
  }

  const token = await createSessionToken({ phone, ttlSeconds });
  if (res) {
    setSessionCookie(res, token, { maxAgeSeconds: ttlSeconds ?? DEFAULT_TTL_SECONDS });
  }
  return token;
}
