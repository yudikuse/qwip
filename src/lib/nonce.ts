// src/lib/nonce.ts
// Geração e validação de NONCE com assinatura HMAC guardada em cookie HTTP-only.

import { cookies } from "next/headers";
import crypto from "crypto";

// Nome do cookie que guarda a assinatura do nonce (não o nonce em si)
const COOKIE_NAME = "ad_sig";
// Tempo de vida do nonce (segundos)
const MAX_AGE = 10 * 60; // 10 min

// Segredo para assinar o nonce (defina em Vercel env)
function getSecret(): string {
  const s =
    process.env.QWIP_NONCE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;
  if (!s) {
    throw new Error(
      "Falta definir QWIP_NONCE_SECRET (ou NEXTAUTH_SECRET) no ambiente."
    );
  }
  return s;
}

// Gera 32 bytes aleatórios => hex (64 chars)
export function generateNonceHex(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Assina o nonce com HMAC-SHA256 => hex
function signNonceHex(nonceHex: string): string {
  const h = crypto.createHmac("sha256", getSecret());
  h.update(nonceHex, "utf8");
  return h.digest("hex");
}

// Seta o cookie httpOnly com a assinatura (não expomos a assinatura ao cliente)
export function setNonceCookie(signatureHex: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: signatureHex,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: MAX_AGE,
  });
}

// Limpa o cookie (após uso ou se inválido)
export function clearNonceCookie() {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
}

// Valida formato do nonce (64 hex)
function isValidFormat(nonceHex: string): boolean {
  return /^[a-f0-9]{64}$/.test(nonceHex);
}

// Valida o nonce recebido no header "X-AD-Nonce" contra a assinatura do cookie.
// Retorna { ok: true } quando válido; caso contrário retorna um objeto com erro padronizado.
export function validateNonceFromHeaders(
  headerValue: string | null | undefined
):
  | { ok: true }
  | { ok: false; status: number; error: string } {
  const nonce = (headerValue || "").trim();

  if (!nonce) {
    return { ok: false, status: 400, error: "Nonce ausente." };
  }
  if (!isValidFormat(nonce)) {
    return { ok: false, status: 400, error: "Nonce inválido (format)." };
  }

  const sigCookie = cookies().get(COOKIE_NAME)?.value || "";
  if (!sigCookie) {
    return { ok: false, status: 419, error: "Nonce ausente/expirado." };
  }

  const expectedSig = signNonceHex(nonce);

  // comparação com constante de tempo
  const a = Buffer.from(expectedSig, "hex");
  const b = Buffer.from(sigCookie, "hex");
  const valid =
    a.length === b.length && crypto.timingSafeEqual ? crypto.timingSafeEqual(a, b) : expectedSig === sigCookie;

  if (!valid) {
    // invalida imediatamente
    clearNonceCookie();
    return { ok: false, status: 401, error: "Nonce inválido (signature)." };
  }

  // single-use: invalida após validar
  clearNonceCookie();
  return { ok: true };
}
