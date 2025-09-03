// src/lib/signing.ts
import crypto from "crypto";

const enc = (buf: Buffer) =>
  buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const dec = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

const SECRET = process.env.QWIP_SIGNING_SECRET || "";

// payload mínimo; pode extender à vontade
export type NonceClaims = {
  sub: "ads";            // finalidade
  phone: string;         // amarra ao telefone logado
  ip: string;            // amarra ao IP do pedido
  ua: string;            // amarra ao user-agent
  path: string;          // rota alvo (/api/ads)
  iat: number;           // emitido em (segundos)
  exp: number;           // expiração (segundos)
};

export function signClaims(claims: NonceClaims): string {
  if (!SECRET) throw new Error("QWIP_SIGNING_SECRET ausente");
  const header = enc(Buffer.from(JSON.stringify({ alg: "HS256", typ: "QWIP" })));
  const payload = enc(Buffer.from(JSON.stringify(claims)));
  const data = `${header}.${payload}`;
  const sig = enc(crypto.createHmac("sha256", SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyToken(token: string): { ok: true; claims: NonceClaims } | { ok: false; reason: string } {
  try {
    if (!SECRET) return { ok: false, reason: "secret_missing" };
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return { ok: false, reason: "format" };
    const data = `${h}.${p}`;
    const expected = enc(crypto.createHmac("sha256", SECRET).update(data).digest());
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) {
      return { ok: false, reason: "sig" };
    }
    const claims = JSON.parse(dec(p).toString("utf8")) as NonceClaims;
    const now = Math.floor(Date.now() / 1000);
    if (claims.exp < now) return { ok: false, reason: "expired" };
    return { ok: true, claims };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
