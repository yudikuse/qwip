import Link from "next/link";
import { headers, cookies } from "next/headers";
import type { Metadata } from "next";
import AdMap from "@/components/AdMap";
import ShareButton from "@/components/ShareButtons";
import WhatsAppButton from "@/components/WhatsAppButton";

export const dynamic = "force-dynamic";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  city: string | null;
  uf: string | null;
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  imageUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
};

function formatPriceBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

async function fetchAd(base: string, id: string): Promise<Ad | null> {
  const r = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  return (data?.ad ?? null) as Ad | null;
}

async function getBaseFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const base = baseEnv ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);

  const title = ad ? `${ad.title} - ${formatPriceBRL(ad.priceCents)}` : "Anúncio";
  const description = ad?.description?.slice(0, 160) ?? "Veja este anúncio no Qwip.";
  const ogImage = `${base}/anuncio/${id}/opengraph-image`;
  const url = `${base}/anuncio/${id}`;
  const amount = ad ? (ad.priceCents / 100).toFixed(2) : undefined;

  return {
    metadataBase: new URL(base),
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: new URL(base).hostname.toUpperCase(),
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    other: {
      "og:type": "product",
      ...(amount ? { "product:price:amount": amount } : {}),
      "product:price:currency": "BRL",
      "og:image:width": "1200",
      "og:image:height": "630",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const base = baseEnv ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);

  if (!ad) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Anúncio não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            O anúncio que você tentou acessar não existe ou expirou.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-xl border border-white/15 px-4 py-2 hover:bg-white/5"
            >
              Voltar
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Telefone verificado do cookie (não usamos aqui; o preview grande depende do "link-only")
  const jar = await cookies();
  const rawCookie = jar.get("qwip_phone_e164")?.value || "";
  let sellerPhone: string | null = null;
  if (rawCookie) {
    try {
      sellerPhone = decodeURIComponent(rawCookie);
    } catch {
      sellerPhone = rawCookie;
    }
  }

  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  const pageUrl = `${base}/anuncio/${ad.id}`;
  const shareTitle = `${ad.title} - ${formatPriceBRL(ad.priceCents)}`;
  const shareText = ad.description?.slice(0, 160) ?? "";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Imagem destaque */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {ad.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-80 w-full object-cover md:h-[28rem]"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-muted-foreground">
                  (Sem imagem)
                </div>
              )}
            </div>
          </div>

          {/* Detalhes */}
          <div>
            <h1 className="text-2xl font-bold">{ad.title}</h1>

            <div className="mt-1 text-lg text-emerald-400">
              {formatPriceBRL(ad.priceCents)}
            </div>

            {ad.description && (
              <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
                {ad.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              {/* Para forçar preview grande no WhatsApp, enviamos SÓ o link */}
              <WhatsAppButton
                sellerPhone={sellerPhone}
                title={ad.title}
                priceCents={ad.priceCents}
                adUrl={pageUrl}
                linkOnly
              />

              <ShareButton
                url={pageUrl}
                title={shareTitle}
                text={shareText}
                className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              />
            </div>
          </div>
        </div>

        {center ? (
          <div className="mt-8">
            <AdMap center={center} radiusKm={ad.radiusKm ?? 5} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
