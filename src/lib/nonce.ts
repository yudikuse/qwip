// src/lib/nonce.ts
import { randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const NONCE_COOKIE = "qwip_n";

/** Gera 32 bytes aleatórios em HEX (64 chars). */
export function generateNonceHex(): string {
  return randomBytes(32).toString("hex");
}

/** Regex de formato HEX (64 chars). */
export function isValidNonceFormat(n: string): boolean {
  return /^[a-f0-9]{64}$/i.test(n);
}

/** Define/atualiza o cookie httpOnly com o nonce (TTL 10 min). */
export function setNonceCookie(res: NextResponse, nonce: string) {
  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 10, // 10 minutos
  });
}

/** Remove o cookie do nonce (após consumo). */
export function deleteNonceCookie(res: NextResponse) {
  res.cookies.delete(NONCE_COOKIE);
}

/**
 * Valida o nonce:
 *  - Header obrigatório: x-qwip-nonce
 *  - Deve ser HEX 64 (formato)
 *  - Deve ser igual ao cookie httpOnly 'qwip_n'
 */
export function checkRequestNonce(
  req: NextRequest
): { ok: true } | { ok: false; error: string; status: number } {
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

/** Cria uma resposta JSON já setando novo nonce no cookie e no payload. */
export function jsonWithNonce(payload: Record<string, unknown>) {
  const nonce = generateNonceHex();
  const res = NextResponse.json({ ...payload, token: nonce });
  setNonceCookie(res, nonce);
  return res;
}

