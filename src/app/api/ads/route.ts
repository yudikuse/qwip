// adicione/garanta isto no topo:
export const runtime = "nodejs";

// ...
import { verifyToken } from "@/lib/signing";
// ...

export async function POST(req: NextRequest) {
  // ...
  const nonce = req.headers.get("x-qwip-nonce") || "";
  const ua = req.headers.get("user-agent") || "";
  if (!nonce) return NextResponse.json({ ok: false, error: "Requisição sem nonce." }, { status: 400 });

  // >>>>> AQUI: agora é assíncrono
  const ver = await verifyToken(nonce);

  if (!ver.ok) return NextResponse.json({ ok: false, error: `Nonce inválido (${ver.reason}).` }, { status: 401 });

  const c = ver.claims;
  // ...
}
