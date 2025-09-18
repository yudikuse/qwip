import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

function brl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function timeLeftLabel(expiresAt?: string | null) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expirado";
  const hours = Math.floor(ms / 3_600_000);
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return d > 0 ? `Expira em ${d}d ${h}h` : `Expira em ${h}h`;
}

export default async function OpengraphImage({
  params,
}: { params: { id: string } }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://qwip.pro";

  let ad: any = null;
  try {
    const r = await fetch(`${base}/api/ads/${params.id}`, { cache: "no-store" });
    if (r.ok) ad = (await r.json())?.ad ?? null;
  } catch {}

  const title = ad?.title ?? "Anúncio";
  const price = brl(ad?.priceCents ?? 0);
  const img = ad?.imageUrl ?? `${base}/og-default.jpg`;
  const badge = timeLeftLabel(ad?.expiresAt);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-start",
          backgroundColor: "#0b0e13",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        {/* fundo = foto do anúncio */}
        <img
          src={img}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* gradiente para legibilidade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.12) 20%, rgba(0,0,0,0.78) 100%)",
          }}
        />

        {/* badge opcional de expiração */}
        {badge && (
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 24,
              padding: "10px 16px",
              borderRadius: 999,
              fontSize: 24,
              fontWeight: 700,
              backgroundColor: "rgba(0,0,0,0.65)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {badge}
          </div>
        )}

        {/* textos */}
        <div style={{ position: "relative", padding: "48px 60px" }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.1,
              textShadow: "0 2px 6px rgba(0,0,0,.4)",
              maxWidth: 1000,
              overflow: "hidden",
              display: "block",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 40,
              fontWeight: 700,
              color: "#34d399",
            }}
          >
            {price}
          </div>
          <div style={{ marginTop: 8, fontSize: 24, color: "#e5e7eb" }}>
            {new URL(base).hostname.toUpperCase()}
          </div>
        </div>
      </div>
    ),
    size
  );
}
