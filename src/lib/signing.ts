// src/lib/signing.ts
import crypto from "crypto";

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
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return crypto.timingSafeEqual(A, B);
}

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

export function verifyToken(
  token: string
): { ok: true; claims: NonceClaims } | { ok: false; reason: string } {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return { ok: false, reason: "format" };
    const expected = hmac(payload);
    if (!timingSafeEq(sig, expected)) return { ok: false, reason: "sig" };

    const claims = JSON.parse(b64urlDecode(payload)) as NonceClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) return { ok: false, reason: "expired" };

    return { ok: true, claims };
  } catch {
    return { ok: false, reason: "malformed" };
  }
}
