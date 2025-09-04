// src/app/api/ads/nonce/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { signToken } from "@/lib/signing";

// (Opcional) defina explicitamente Edge; com await cookies() funciona nos dois runtimes.
export const runtime = "edge";

function ipFrom(req: NextRequest) {
  const xfwd = req.headers.get("x-forwarded-for");
  return (xfwd?.split(",")[0] || "").trim() || "0.0.0.0";
}

export async function GET(req: NextRequest) {
  try {
    // No runtime Edge o tipo é Promise<ReadonlyRequestCookies> → use await
    const jar = await cookies();
    const phone = jar.get("qwip_phone_e164")?.value;

    if (!phone) {
      return NextResponse.json({ error: "not authenticated" }, { status: 401 });
    }

    const nonce = signToken(
      {
        sub: "ads",
        path: "/api/ads",
        ip: ipFrom(req),
        ua: req.headers.get("user-agent") || "",
        phone,
      },
      60 // TTL do nonce
    );

    return NextResponse.json(
      { ok: true, nonce },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[nonce]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
