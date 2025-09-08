// src/lib/auth-phone.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const PHONE_COOKIE = "qwip_phone_e164";

export function getPhoneFromCookie(req: NextRequest): string | null {
  return req.cookies.get(PHONE_COOKIE)?.value ?? null;
}

export function setPhoneCookie(res: NextResponse, e164: string): NextResponse {
  // cookie visível ao client (não HttpOnly), lido pelo middleware
  res.cookies.set(PHONE_COOKIE, e164, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });
  return res;
}
