// src/lib/nonce.ts
import crypto from "crypto";

const SECRET = process.env.QWIP_NONCE_SECRET || "";

function b64url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlToBuf(s: string) {
  const pad = 4 - (s.length % 4 || 4);
  const base64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad === 4 ? 0 : pad);
  return Buffer.from(base64, "base64");
}

export function signNonce(payload: Record<string, any>): string {
  if (!SECRET) throw new Error("QWIP_NONCE_SECRET ausente");
  const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest());
  return `${header}.${body}.${sig}`;
}

export function verifyNonce(token: string):
  | { ok: true; payload: any }
  | { ok: false; reason: "format" | "sig" | "secret" } {
  if (!SECRET) return { ok: false, reason: "secret" };
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "format" };
  const [h, p, givenSig] = parts;

  const expectedSig = b64url(crypto.createHmac("sha256", SECRET).update(`${h}.${p}`).digest());
  const a = Buffer.from(givenSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, reason: "sig" };

  const payloadJson = b64urlToBuf(p).toString("utf8");
  const payload = JSON.parse(payloadJson);
  return { ok: true, payload };
}
