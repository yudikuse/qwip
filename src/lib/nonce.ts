// src/app/api/ads/nonce/route.ts
import { NextResponse } from "next/server";
import { generateNonceHex, setNonceCookie } from "@/lib/nonce";

/**
 * Gera nonce HEX (64 chars), grava em cookie httpOnly/sameSite=lax
 * e retorna também no corpo (campos `nonce` e `token` iguais).
 */
function respondWithNonce(): NextResponse {
  const nonce = generateNonceHex(); // 64 chars em HEX
  const res = NextResponse.json(
    { ok: true, status: 200, nonce, token: nonce },
    { status: 200 }
  );
  setNonceCookie(res, nonce);
  return res;
}

export async function GET() {
  return respondWithNonce();
}

export const POST = GET;

