// src/lib/signing.ts
import crypto from "crypto";

/**
 * Use uma SECRET forte nas variáveis de ambiente:
 *  - SIGNING_SECRET  (ou QWIP_SIGNING_SECRET)
 */
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

function b64urlEncode(str: string) {
  return Buffer.from(str).toString("base64url");
}
function b64urlDecode(b64: string) {
  return Buffer.from(b64, "base64url").toString("utf8");
}
function hmac(payload: string) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}
function timingSafeEq(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Assina um nonce com TTL (segundos). */
export function signToken(
  claims: Omit<NonceClaims, "iat" | "exp">,
  ttlSec = 60
): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSec;
  const full: NonceClaims = { ...claims, iat, exp };
  const payload = b64urlEncode(JSON.stringify(full));
  const sig = hmac(payload);
  return `${payload}.${sig}`;
}

/** Verifica o nonce assinado. */
export function verifyToken(token: string):
  | { ok: true; claims: NonceClaims }
  | { ok: false; reason: string } {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return { ok: false, reason: "format" };
    const expected = hmac(payload);
    if (!timingSafeEq(sig, expected)) return { ok: false, reason: "sig" };

    const json = JSON.parse(b64urlDecode(payload)) as NonceClaims;
    const now = Math.floor(Date.now() / 1000);
    if (json.exp < now) return { ok: false, reason: "expired" };

    return { ok: true, claims: json };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}
