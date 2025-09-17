// src/app/anuncio/[id]/opengraph-image.tsx
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

export default async function OpengraphImage({
  params,
}: {
  params: { id: string };
}) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://qwip.pro";

  // carrega o anúncio (sem cache)
  let ad: any = null;
  try {
    const r = await fetch(`${base}/api/ads/${params.id}`, { cache: "no-store" });
    if (r.ok) ad = (await r.json())?.ad ?? null;
  } catch {}

  const title = ad?.title ?? "Anúncio";
  const price = brl(ad?.priceCents ?? 0);
  const img = ad?.imageUrl ?? `${base}/og-default.jpg`;

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
        {/* background = foto do anúncio */}
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
              "linear-gradient(180deg, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        {/* texto */}
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
            qwip.pro
          </div>
        </div>
      </div>
    ),
    size
  );
}
