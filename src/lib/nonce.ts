// src/lib/nonce.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const NONCE_COOKIE = "qwip_n";

/** 32 bytes aleatórios -> HEX (64 chars) */
export function generateNonceHex(): string {
  // Node (Vercel) tem 'crypto' nativo
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { randomBytes } = require("crypto") as { randomBytes: (n: number) => Buffer };
  return randomBytes(32).toString("hex"); // 64 chars
}

/** Regex de formato HEX (64 chars) */
export function isValidNonceFormat(n: string): boolean {
  return /^[a-f0-9]{64}$/i.test(n);
}

/** Seta/atualiza o cookie httpOnly com o nonce (10 min de vida) */
export function setNonceCookie(res: NextResponse, nonce: string) {
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 10,
  });
}

/** Remove o cookie do nonce (consumo) */
export function deleteNonceCookie(res: NextResponse) {
  res.cookies.delete(NONCE_COOKIE);
}

/**
 * Verifica o nonce *somente* pelo header 'x-qwip-nonce' e
 * compara com o cookie httpOnly 'qwip_n'.
 *
 * Retorna:
 *  - { ok: true }    -> válido (consuma o cookie com deleteNonceCookie(res))
 *  - { ok: false, error, status }
 */
export function checkRequestNonce(req: NextRequest): { ok: true } | { ok: false; error: string; status: number } {
  const supplied = (req.headers.get("x-qwip-nonce") || "").trim();
  if (!isValidNonceFormat(supplied)) {
    return { ok: false, error: "Nonce inválido (format).", status: 400 };
  }

  const cookie = req.cookies.get(NONCE_COOKIE)?.value || "";
  if (!cookie) {
    return { ok: false, error: "Nonce ausente no cookie.", status: 400 };
  }

  if (supplied !== cookie) {
    return { ok: false, error: "Nonce inválido (mismatch).", status: 400 };
  }

  return { ok: true };
}

/** Cria uma resposta JSON já setando o cookie do nonce */
export function jsonWithNonce(payload: Record<string, unknown>) {
  const nonce = generateNonceHex();
  const res = NextResponse.json({ ...payload, token: nonce });
  setNonceCookie(res, nonce);
  return res;
}
