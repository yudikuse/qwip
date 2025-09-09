// src/lib/nonce.ts
// Utilitários de NONCE (token curto assinado) para proteger mutações.
// Next.js 15 compatível: usa NextResponse.cookies.set (nada de cookies().set).

import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken } from "@/lib/signing";

export const NONCE_HEADER = "x-qwip-nonce";
export const NONCE_COOKIE = "qwip_nonce_sig";

// ===== Helpers =====
function ipFrom(req?: NextRequest): string {
  if (!req) return "0.0.0.0";
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}
function uaFrom(req?: NextRequest): string {
  if (!req) return "";
  return req.headers.get("user-agent") || "";
}

// ===== Tipos =====
export type NonceClaims = {
  sub: string;    // ex.: "ads"
  path?: string;  // ex.: "/api/ads"
  phone?: string;
  ip?: string;
  ua?: string;
  iat: number;    // epoch s
  exp: number;    // epoch s
};

// Define o cookie httpOnly com o token (sem expor dados sensíveis ao client)
export function setNonceCookie(resOrToken: NextResponse | string, tokenMaybe?: string, maxAgeSeconds = 60) {
  // Suporta ambos formatos:
  //   setNonceCookie(res, token, maxAge)
  //   setNonceCookie(token)  -> no-op (compatibilidade legada; o cookie será setado via jsonWithNonce)
  if (typeof resOrToken === "string") {
    // Chamadas antigas: não temos acesso ao Response aqui. Evitamos quebrar (no-op).
    return;
  }
  const res = resOrToken as NextResponse;
  const token = tokenMaybe ?? "";
  if (!token) return;

  res.cookies.set(NONCE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

// Retorna um JSON já com um novo nonce (em Header + Cookie).
export async function jsonWithNonce(
  body: unknown,
  opts?: {
    status?: number;
    headers?: Record<string, string>;
    ttlSeconds?: number;            // padrão 60s
    claims?: Partial<NonceClaims>;  // sub/path/phone
    req?: NextRequest;              // para ip/ua
  }
): Promise<NextResponse> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));

  const claims: NonceClaims = {
    sub: opts?.claims?.sub ?? "generic",
    path: opts?.claims?.path,
    phone: opts?.claims?.phone,
    ip: opts?.claims?.ip ?? ipFrom(opts?.req),
    ua: opts?.claims?.ua ?? uaFrom(opts?.req),
    iat: now,
    exp: now + ttl,
  };

  const token = await signToken(claims);

  const res = NextResponse.json(body, {
    status: opts?.status ?? 200,
    headers: {
      "Cache-Control": "no-store",
      ...(opts?.headers ?? {}),
    },
  });

  res.headers.set("X-Qwip-Nonce", token);
  setNonceCookie(res, token, ttl);

  return res;
}

// Extrai e valida o nonce de Header OU Cookie (fallback)
export async function extractAndVerifyNonce(
  req: NextRequest
): Promise<{ ok: boolean; claims?: NonceClaims; reason?: string }> {
  const token =
    req.headers.get(NONCE_HEADER) ||
    req.cookies.get(NONCE_COOKIE)?.value ||
    "";

  if (!token) return { ok: false, reason: "missing" };

  const v = await verifyToken(token);
  if (!v.ok || !v.claims) return { ok: false, reason: v.reason || "invalid" };

  // (Opcional) checar ip/ua aqui; por compatibilidade, mantemos permissivo.
  return { ok: true, claims: v.claims as NonceClaims };
}

// ====== ALIASES de compatibilidade ======
// Alguns trechos antigos chamam "generateNonceHex". Mantemos um alias
// que simplesmente retorna o token atual (base64url).
export async function generateNonceHex(
  opts?: { ttlSeconds?: number; claims?: Partial<NonceClaims>; req?: NextRequest }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(10, Math.floor(opts?.ttlSeconds ?? 60));
  const claims: NonceClaims = {
    sub: opts?.claims?.sub ?? "generic",
    path: opts?.claims?.path,
    phone: opts?.claims?.phone,
    ip: opts?.claims?.ip,
    ua: opts?.claims?.ua,
    iat: now,
    exp: now + ttl,
  };
  return signToken(claims);
}
