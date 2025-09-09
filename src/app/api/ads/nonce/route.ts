// src/app/api/ads/nonce/route.ts
import { NextResponse } from "next/server";
import { generateNonceB64, setNonceCookie } from "@/lib/nonce";

/**
 * Gera um nonce e grava em cookie HTTP-only.
 * Responde com { ok:true, status:200, nonce, token } (ambos iguais)
 * para compatibilidade com qualquer cliente existente.
 */
function respondWithNonce(): NextResponse {
  const nonce = generateNonceB64(); // 43 chars base64url sem padding
  const res = NextResponse.json(
    { ok: true, status: 200, nonce, token: nonce },
    { status: 200 },
  );
  setNonceCookie(res, nonce);
  return res;
}

export async function GET() {
  return respondWithNonce();
}

// Permite POST também (alguns clientes chamam via POST)
export const POST = GET;
