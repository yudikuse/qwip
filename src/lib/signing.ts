// src/lib/signing.ts
import crypto from "crypto";

const b64url = {
  enc(buf: Buffer) {
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  },
  dec(s: string) {
    return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  },
};

const SECRET = process.env.QWIP_SIGNING_SECRET || "";

export type NonceClaims = {
  sub: "ads";
  phone: string;      // +5511999999999 (do cookie)
  ip: string;         // IP do cliente
  ua: string;         // User-Agent
  path: string;       // rota alvo, ex: "/api/ads"
  iat: number;        // issued at (segundos)
  exp: number;        // expires at (segundos)
};

export function signClaims(claims: NonceClaims): string {
  if (!SECRET) throw new Error("QWIP_SIGNING_SECRET ausente");
  const header = b64url.enc(Buffer.from(JSON.stringify({ alg: "HS256", typ: "QWIP" })));
  const payload = b64url.enc(Buffer.from(JSON.stringify(claims)));
  const data = `${header}.${payload}`;
  const sig = b64url.enc(crypto.createHmac("sha256", SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyToken(token: string):
  | { ok: true; claims: NonceClaims }
  | { ok: false; reason: "format" | "sig" | "expired" | "invalid" | "secret" } {
  try {
    if (!SECRET) return { ok: false, reason: "secret" };
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return { ok: false, reason: "format" };

    const data = `${h}.${p}`;
    const expected = b64url.enc(crypto.createHmac("sha256", SECRET).update(data).digest());
    // timing-safe
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) {
      return { ok: false, reason: "sig" };
    }

    const claims = JSON.parse(b64url.dec(p).toString("utf8")) as NonceClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) return { ok: false, reason: "expired" };

    return { ok: true, claims };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
