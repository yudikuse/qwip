// src/lib/signing.ts
// Assinatura/verificação HS256 com base64url (sem padding) usando WebCrypto (crypto.subtle)
// Compatível com Node 18+/Vercel e também Edge, sem 'import("crypto")'.

export type Claims = {
  sub: "ads";
  path: "/api/ads";
  phone: string;
  ip: string;
  ua: string;
  iat: number; // epoch (s)
  exp: number; // epoch (s)
};

type VerifyOk = { ok: true; claims: Claims };
type VerifyErr = { ok: false; reason: string };
export type VerifyResult = VerifyOk | VerifyErr;

const SECRET =
  process.env.SIGNING_SECRET ||
  "dev-secret-change-me"; // não deixe isso em prod

// ---------- utils base64/base64url ----------
function base64ToBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlToBase64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function bytesToBase64(bytes: Uint8Array): string {
  // Em Node, Buffer existe; no Edge, cai no fallback btoa
  // @ts-ignore
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  // @ts-ignore
  return btoa(bin);
}
function base64ToBytes(b64: string): Uint8Array {
  // @ts-ignore
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  // @ts-ignore
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// ---------- HMAC-SHA256 via WebCrypto ----------
async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoAny: any = (globalThis as any).crypto;
  if (!cryptoAny?.subtle) {
    throw new Error("WebCrypto subtle not available in this runtime");
  }
  const key = await cryptoAny.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await cryptoAny.subtle.sign("HMAC", key, data);
  return new Uint8Array(sig);
}

// ---------- time-safe compare ----------
function timingSafeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a[i] ^ b[i];
  return v === 0;
}

// ---------- API ----------
export async function signToken(claims: Claims): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const headB64u = base64ToBase64Url(bytesToBase64(utf8Encode(JSON.stringify(header))));
  const bodyB64u = base64ToBase64Url(bytesToBase64(utf8Encode(JSON.stringify(claims))));
  const toSign = `${headB64u}.${bodyB64u}`;

  const sig = await hmacSha256(utf8Encode(SECRET), utf8Encode(toSign));
  const sigB64u = base64ToBase64Url(bytesToBase64(sig));
  return `${toSign}.${sigB64u}`;
}

export async function verifyToken(token: string): Promise<VerifyResult> {
  if (typeof token !== "string") return { ok: false, reason: "type" };

  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };

  const [h, p, s] = parts;

  const headerJson = utf8Decode(base64ToBytes(base64UrlToBase64(h)));
  const payloadJson = utf8Decode(base64ToBytes(base64UrlToBase64(p)));
  const header = safeJsonParse<{ alg: string; typ: string }>(headerJson);
  const claims = safeJsonParse<Claims>(payloadJson);

  if (!header || header.alg !== "HS256" || header.typ !== "JWT") {
    return { ok: false, reason: "header" };
  }
  if (!claims) return { ok: false, reason: "payload" };

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat)) {
    return { ok: false, reason: "times" };
  }
  if (claims.exp <= now) return { ok: false, reason: "expired" };

  const toSign = `${h}.${p}`;
  const expected = await hmacSha256(utf8Encode(SECRET), utf8Encode(toSign));
  const got = base64ToBytes(base64UrlToBase64(s));
  if (!timingSafeEq(expected, got)) return { ok: false, reason: "signature" };

  return { ok: true, claims };
}
