// src/lib/nonce.ts
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/** 5 min */
export const NONCE_MAX_AGE = 60 * 5;

/** Gera nonce URL-safe (43 chars) – padrão para base64url sem padding */
export function generateNonceB64(): string {
  return randomBytes(32).toString("base64url"); // 43 chars
}

/** Aceita nonce 43 chars base64url OU 64 chars hex (retrocompat) */
export function isValidNonce(n: string): boolean {
  if (!n) return false;
  return /^[A-Za-z0-9\-_]{43}$/.test(n) || /^[A-Fa-f0-9]{64}$/.test(n);
}

/** Lê o cookie "nonce" e valida formato; retorna null se inválido */
export function readNonceCookie(req: NextRequest): string | null {
  const v = req.cookies.get("nonce")?.value ?? "";
  return isValidNonce(v) ? v : null;
}

/** Seta cookie httpOnly/sameSite Lax; usa sempre o mesmo valor passado */
export function setNonceCookie(res: NextResponse, nonce: string) {
  res.cookies.set("nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: NONCE_MAX_AGE,
  });
}

/**
 * Verificação padronizada p/ ser usada no topo dos seus handlers de publicação/upload:
 *
 *   const fail = requireNonce(req);
 *   if (fail) return fail;
 *
 * Retorna NextResponse 400 somente se o cookie estiver ausente/fora do formato.
 * NÃO devolve 401 – assim o cliente não redireciona para /verificar.
 */
export function requireNonce(req: NextRequest): NextResponse | null {
  const nonce = readNonceCookie(req);
  if (!nonce) {
    return NextResponse.json(
      { ok: false, error: "nonce inválido (format).", status: 400 },
      { status: 400 },
    );
  }
  return null;
}
