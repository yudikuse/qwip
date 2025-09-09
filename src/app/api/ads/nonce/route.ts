// src/app/api/nonce/route.ts
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

/**
 * Gera um nonce seguro, grava em cookie httpOnly
 * e retorna no corpo tanto em `token` quanto em `nonce`
 * (retrocompatibilidade com clients que esperam um dos nomes).
 */
function generateNonce(): string {
  // 256 bits, URL-safe
  return randomBytes(32).toString("base64url");
}

function buildResponse(nonce: string, status = 200) {
  const res = NextResponse.json(
    {
      ok: true,
      status,
      // retrocompatível: alguns clients consomem `token`,
      // outros procuram `nonce`. Enviamos os dois.
      token: nonce,
      nonce,
    },
    { status },
  );

  // cookie httpOnly com o mesmo valor — usado na validação server-side
  res.cookies.set("nonce", nonce, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // 5 minutos
    maxAge: 60 * 5,
  });

  return res;
}

export async function GET() {
  const nonce = generateNonce();
  return buildResponse(nonce);
}

// alguns clients podem chamar via POST — tratamos igualmente
export const POST = GET;
