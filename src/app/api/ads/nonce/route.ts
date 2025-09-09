// src/app/api/ads/nonce/route.ts
import { jsonWithNonce } from "@/lib/nonce";

export const dynamic = "force-dynamic";

/**
 * GET /api/ads/nonce
 * Gera um nonce (HEX 64 chars), grava em cookie httpOnly e devolve { token }.
 */
export async function GET() {
  return jsonWithNonce({ ok: true });
}
