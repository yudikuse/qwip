// src/lib/session.ts
// Sessão assinada em cookie (HS256 base64url) compatível com Edge/Node.
// Cookie: qwip_session = v1.<payload>.<signature>
// payload = { phone, iat, exp } em JSON e base64url
// Assinatura = HMAC-SHA256(SECRET, "v1.<payload>")

export type SessionClaims = {
  phone: string;
  iat: number; // epoch (s)
  exp: number; // epoch (s)
};

const SECRET =
  process.env.SIGNING_SECRET ||
  process.env.QWIP_SIGNING_SECRET ||
  "dev-secret-change-me";

// ---- base64/url helpers ----
function b64ToB64u(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64uToB64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}
function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}
function dec(u8: Uint8Array): string {
  return new TextDecoder().decode(u8);
}
function bytesToB64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return Buffer.from(bytes).toString("base64");
  }
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  // @ts-ignore
  return btoa(bin);
}
function b64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    // @ts-ignore
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  // @ts-ignore
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Converte Uint8Array em ArrayBuffer “exato” (respeitando offset/length)
function u8ToArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

// ---- HMAC-SHA256 (WebCrypto) ----
async function hmacSha256(keyRaw: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    u8ToArrayBuffer(keyRaw), // <- evita erro de tipagem
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, u8ToArrayBuffer(data));
  return new Uint8Array(sig);
}

function timingSafeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---- Public API ----
export async function issueSession(phoneE164: string, ttlHours = 24): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + Math.floor(ttlHours * 3600);
  const payload: SessionClaims = { phone: phoneE164, iat, exp };
  const version = "v1";
  const p = b64ToB64u(bytesToB64(enc(JSON.stringify(payload))));
  const toSign = `${version}.${p}`;
  const sig = await hmacSha256(enc(SECRET), enc(toSign));
  const s = b64ToB64u(bytesToB64(sig));
  return `${toSign}.${s}`;
}

export type VerifySessionResult =
  | { ok: true; claims: SessionClaims }
  | { ok: false; reason: string };

export async function verifySessionValue(value: string | undefined | null): Promise<VerifySessionResult> {
  if (!value) return { ok: false, reason: "missing" };
  const parts = value.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  const [version, p, s] = parts;
  if (version !== "v1") return { ok: false, reason: "version" };
  let claims: SessionClaims;
  try {
    const json = dec(b64ToBytes(b64uToB64(p)));
    claims = JSON.parse(json);
  } catch {
    return { ok: false, reason: "payload" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat)) {
    return { ok: false, reason: "times" };
  }
  if (claims.exp <= now) return { ok: false, reason: "expired" };

  const toSign = `${version}.${p}`;
  const expected = await hmacSha256(enc(SECRET), enc(toSign));
  const got = b64ToBytes(b64uToB64(s));
  if (!timingSafeEq(expected, got)) return { ok: false, reason: "signature" };

  return { ok: true, claims };
}
