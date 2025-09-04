// src/lib/signing.ts

const SECRET =
  process.env.SIGNING_SECRET ||
  process.env.QWIP_SIGNING_SECRET ||
  "CHANGE_ME_IN_PRODUCTION";

export type NonceClaims = {
  sub: "ads";
  path: "/api/ads";
  ip: string;
  ua: string;
  phone: string;
  iat: number;
  exp: number;
};

// ---------- helpers base64url cross-runtime ----------
function b64urlEncodeString(str: string): string {
  if (typeof btoa === "function") {
    // Edge / Browser
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  } else {
    // Node
    // eslint-disable-next-line n/no-deprecated-api
    // @ts-ignore - Buffer existe no Node runtime
    const b64 = Buffer.from(str, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
}

function b64urlDecodeToString(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  if (typeof atob === "function") {
    // Edge / Browser
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } else {
    // Node
    // @ts-ignore
    return Buffer.from(b64, "base64").toString("utf8");
  }
}

function toHex(buffer: ArrayBuffer): string {
  const a = new Uint8Array(buffer);
  let out = "";
  for (const v of a) out += v.toString(16).padStart(2, "0");
  return out;
}

// comparação em tempo (quase) constante para strings
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
}

// HMAC-SHA256 → hex (Edge/Browser via crypto.subtle; Node 18+ também tem)
async function hmacSha256Hex(payload: string, secret: string): Promise<string> {
  if (globalThis.crypto?.subtle) {
    const enc = new TextEncoder();
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(payload));
    return toHex(sig);
  }
  // Se estiver num Node antigo sem crypto.subtle, falhe explicitamente
  throw new Error("crypto.subtle not available");
}

// ---------- API pública ----------
export async function signToken(
  claims: Omit<NonceClaims, "iat" | "exp">,
  ttlSec = 60
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSec;
  const full: NonceClaims = { ...claims, iat, exp };
  const payload = b64urlEncodeString(JSON.stringify(full));
  const sig = await hmacSha256Hex(payload, SECRET);
  return `${payload}.${sig}`;
}

export async function verifyToken(
  token: string
): Promise<{ ok: true; claims: NonceClaims } | { ok: false; reason: string }> {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return { ok: false, reason: "format" };
    const expected = await hmacSha256Hex(payload, SECRET);
    if (!safeEqual(sig, expected)) return { ok: false, reason: "sig" };

    const claims = JSON.parse(b64urlDecodeToString(payload)) as NonceClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) return { ok: false, reason: "expired" };

    return { ok: true, claims };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}
