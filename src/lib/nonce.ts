// src/lib/nonce.ts
// Utilitários de NONCE (token curto assinado) para proteger mutações.
// Next.js 15 compatível: usa NextResponse.cookies.set (nada de cookies().set).

import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  verifyToken,
  type Claims as SigningClaims,
} from "@/lib/signing";

export const NONCE_HEADER = "x-qwip-nonce";
export const NONCE_COOKIE = "qwip_nonce_sig";
const DEFAULT_PATH = "/api/ads";

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
export type NonceClaims = SigningClaims;

// Define o cookie httpOnly com o token (sem expor dados sensíveis ao client)
export function setNonceCookie(
  resOrToken: NextResponse | string,
  tokenMaybe?: string,
  maxAgeSeconds = 60
) {
  // Suporta ambos formatos:
  //   setNonceCookie(res, token, maxAge)
  //   setNonceCookie(token)  -> no-op (compat de chamadas antigas sem acesso ao Response)
  if (typeof resOrToken === "string") return;

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
export async function jsonWith
