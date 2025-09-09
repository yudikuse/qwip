// src/app/api/ads/nonce/route.ts
import { NextResponse } from "next/server";
import { generateNonceHex, setNonceCookie } from "@/lib/nonce";

export async function GET() {
  try {
    const nonce = generateNonceHex();        // 64 chars HEX
    const sig = cryptoSign(nonce);           // assinatura HMAC do nonce
    setNonceCookie(sig);                      // guarda assinatura no cookie httpOnly

    // payload enxuto, sem dados sensíveis
    return NextResponse.json({ ok: true, token: nonce }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Falha ao gerar nonce." },
      { status: 500 }
    );
  }
}

// pequena ajuda local para não exportar sign direto do módulo
import crypto from "crypto";
function cryptoSign(nonce: string): string {
  const secret =
    process.env.QWIP_NONCE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "";
  const h = crypto.createHmac("sha256", secret);
  h.update(nonce, "utf8");
  return h.digest("hex");
}
