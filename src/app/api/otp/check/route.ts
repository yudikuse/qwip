import { NextRequest, NextResponse } from "next/server";
import { checkOtpViaVerify, type CheckResp } from "@/lib/twilio";

export async function POST(req: NextRequest) {
  const { code } = await req.json().catch(() => ({ code: "" as string }));
  const phone = req.cookies.get("otp_phone")?.value || "";

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "Sessão expirada. Envie o código novamente.", status: 440 } as CheckResp,
      { status: 440 }
    );
  }
  if (!code || String(code).replace(/\D+/g, "").length < 4) {
    return NextResponse.json(
      { ok: false, error: "Código inválido.", status: 400 } as CheckResp,
      { status: 400 }
    );
  }

  const tw = await checkOtpViaVerify(phone, String(code));

  if (!tw.ok) {
    return NextResponse.json(
      { ok: false, error: tw.error || "Código inválido ou expirado.", status: tw.status || 400 } as CheckResp,
      { status: tw.status || 400 }
    );
  }

  // Aprovado → autentica e limpa cookies temporários
  const res = NextResponse.json(
    { ok: true, approved: true, status: 200 } as CheckResp,
    { status: 200 }
  );

  res.cookies.delete("otp_phone");
  res.cookies.set("auth_ok", "1", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });

  return res;
}
