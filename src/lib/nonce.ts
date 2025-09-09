// src/lib/nonce.ts
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";

/** 5 minutos */
export const NONCE_MAX_AGE = 60 * 5;

/** Gera nonce em HEX (64 chars) — formato esperado pelo backend de upload */
export function generateNonceHex(): string {
  return randomBytes(32).toString("hex"); // 64 chars
}

/** Aceita HEX (64) ou base64url (43) — retrocompatibilidade */
export function isValidNonce(n: string): boolean {
  if (!n) return false;
  return /^[A-Fa-f0-9]{64}$/.test(n) || /^[A-Za-z0-9\-_]{43}$/.test(n);
}

/** Lê cookie 'nonce' (ou 'token') e valida; retorna null se inválido */
export function readNonceCookie(req: NextRequest): string | null {
  const cookie =
    req.cookies.get("nonce")?.value ??
    req.cookies.get("token")?.value ??
    "";
  return isValidNonce(cookie) ? cookie : null;
}

/** Grava cookie httpOnly/sameSite Lax com o valor informado */
export function setNonceCookie(res: NextResponse, nonce: string) {
  res.cookies.set("nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: NONCE_MAX_AGE,
  });
  // muitos clientes antigos liam 'token' — mantém espelhado
  res.cookies.set("token", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: NONCE_MAX_AGE,
  });
}

/**
 * Útil para endpoints que queiram validar o nonce do cookie sem derrubar a sessão.
 * Retorna 400 (não 401) para evitar redirecionar o usuário para /verificar.
 */
export function requireNonce(req: NextRequest): NextResponse | null {
  const nonce = readNonceCookie(req);
  if (!nonce) {
    return NextResponse.json(
      { ok: false, error: "nonce inválido (format).", status: 400 },
      { status: 400 }
    );
  }
  return null;
}
