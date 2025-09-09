// src/lib/nonce.ts

import { NextResponse } from "next/server";

/** Nome único do cookie usado no fluxo de publicação de anúncio */
export const NONCE_COOKIE = "ad_nonce";

/** Gera um nonce HEX de 64 caracteres (256 bits). */
export function generateNonceHex(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

/** Valida se a string está no formato de nonce HEX de 64 chars. */
export function isValidHexNonce(nonce: string | undefined | null): boolean {
  if (!nonce || typeof nonce !== "string") return false;
  return /^[a-f0-9]{64}$/i.test(nonce);
}

/**
 * Grava o nonce no cookie httpOnly/sameSite=lax.
 * `maxAge` padrão de 10 minutos.
 */
export function setNonceCookie(
  res: NextResponse,
  nonce: string,
  maxAgeSeconds = 60 * 10
): void {
  res.cookies.set({
    name: NONCE_COOKIE,
    value: nonce,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

/** Lê o nonce do cookie da requisição. */
export function readNonceFromRequest(req: Request): string | undefined {
  // Em Route Handler do Next, os cookies vêm via header "cookie".
  const cookieHeader = req.headers.get("cookie") ?? "";
  const parts = cookieHeader.split(/;\s*/);
  for (const p of parts) {
    const [k, ...rest] = p.split("=");
    if (k === NONCE_COOKIE) return rest.join("=");
  }
  return undefined;
}
