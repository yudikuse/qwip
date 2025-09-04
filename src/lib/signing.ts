// src/lib/signing.ts
// Assinatura e verificação de tokens (HS256, base64url sem padding) robustas a Safari/headers.
// Forçaremos uso em rotas Node (nonce/ads), mas este módulo também funciona em Edge.

// ---- Tipos ----
export type Claims = {
  sub: "ads";
  path: "/api/ads";
  phone: string;
  ip: string;
  ua: string;
  iat: number; // epoch segundos
  exp: number; // epoch segundos
};

type VerifyOk = { ok: true; claims: Claims };
type VerifyErr = { ok: false; reason: string };
export type VerifyResult = VerifyOk | VerifyErr;

// ---- Segredo ----
const SECRET =
  process.env.SIGNING_SECRET ||
  // NÃO deixe isso em produção; é só fallback local.
  "dev-secret-change-me";

// ---- Utils base64/base64url ----
function toUint8(arr: ArrayBuffer | Uint8Array): Uint8Array {
  return arr instanceof Uint8Array ? arr : new Uint8Array(arr);
}

function base64ToBase64Url(b64: string): string {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBase64(b64u: string): string {
  const s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  // adiciona padding se faltar
  const pad = s.length % 4;
  return pad ? s + "=".repeat(4 - pad) : s;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Node tem Buffer:
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  // Fallback (runtime web): btoa com string binária
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  // eslint-disable-next-line no-undef
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  // eslint-disable-next-line no-undef
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8Encode(s: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(s);
  // Node antigo: Buffer
  // @ts-ignore
  return Uint8Array.from(Buffer.from(s, "utf-8"));
}

function utf8Decode(bytes: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") return new TextDecoder().decode(bytes);
  // @ts-ignore
  return Buffer.from(bytes).toString("utf-8");
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

// ---- HMAC-SHA256 ----
async function hmacSha256(keyBytes: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  // Node: usar crypto nativo
  try {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const nodeCrypto: typeof import("crypto") = await import("crypto");
    const h = nodeCrypto.createHmac("sha256", Buffer.from(keyBytes));
    h.update(Buffer.from(data));
    return new Uint8Array(h.digest());
  } catch {
    // Edge/WebCrypto (não deve rodar aqui, mas fica como fallback)
    const cryptoAny = (globalThis as any).crypto;
    if (!cryptoAny?.subtle) throw new Error("No crypto.subtle available");
    const key = await cryptoAny.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    const sig = await cryptoAny.subtle.sign("HMAC", key, data);
    return toUint8(sig);
  }
}

// ---- Compare constante ----
function timingSafeEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let v = 0;
  for (let i = 0; i < a.length; i++) v |= a[i] ^ b[i];
  return v === 0;
}

// ---- API pública ----
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

  // Decode header/payload com padding tolerante
  const hJson = utf8Decode(base64ToBytes(base64UrlToBase64(h)));
  const pJson = utf8Decode(base64ToBytes(base64UrlToBase64(p)));
  const header = safeJsonParse<{ alg: string; typ: string }>(hJson);
  const claims = safeJsonParse<Claims>(pJson);

  if (!header || header.alg !== "HS256" || header.typ !== "JWT")
    return { ok: false, reason: "header" };
  if (!claims) return { ok: false, reason: "payload" };

  // exp/iat
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(claims.exp) || !Number.isFinite(claims.iat))
    return { ok: false, reason: "times" };
  if (claims.exp <= now) return { ok: false, reason: "expired" };

  // Reassina e compara
  const toSign = `${h}.${p}`;
  const expected = await hmacSha256(utf8Encode(SECRET), utf8Encode(toSign));
  const got = base64ToBytes(base64UrlToBase64(s));
  if (!timingSafeEq(expected, got)) return { ok: false, reason: "signature" };

  return { ok: true, claims };
}
