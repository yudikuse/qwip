// src/app/anuncio/[id]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import AdMap from "@/components/AdMap";
import ShareButton from "@/components/ShareButtons";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string | null;
  uf: string | null;
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  imageUrl: string | null;
  createdAt: string;      // ISO
  expiresAt?: string;     // ISO
  sellerPhone?: string | null; // vem do servidor já verificado
};

function formatPriceBRL(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  return (v / 100).toLocaleString("pt-BR", {
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
  const ogImage = ad?.imageUrl ?? `${base}/og-default.jpg`;
  const url = `${base}/anuncio/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Qwip",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "article",
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
              href="/vitrine"
              className="rounded-lg border px-4 py-2 font-medium hover:bg-white/5"
            >
              ← Voltar para a Vitrine
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  const pageUrl = `${base}/anuncio/${ad.id}`;
  const shareTitle = `${ad.title} - ${formatPriceBRL(ad.priceCents)}`;
  const shareText = ad.description?.slice(0, 160) ?? "";

  const expiresDate = ad.expiresAt ? new Date(ad.expiresAt) : null;
  const expiresText =
    expiresDate
      ? `Válido até ${expiresDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} de ${expiresDate.toLocaleDateString("pt-BR")}`
      : null;

  // mensagem padrão de contato
  const waMsg = `Olá! Tenho interesse no seu anúncio "${ad.title}" (${formatPriceBRL(ad.priceCents)}). Está disponível? ${pageUrl}`;

  // normaliza telefone para somente dígitos (o WhatsApp aceita apenas dígitos no parâmetro phone)
  const phoneDigits = (ad.sellerPhone ?? "").replace(/\D/g, "");
  const phoneOk = phoneDigits.length >= 10; // regra mínima razoável

  // usa api.whatsapp.com (mais tolerante que wa.me)
  const waHref = phoneOk
    ? `https://api.whatsapp.com/send?phone=${phoneDigits}&text=${encodeURIComponent(waMsg)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${pageUrl}`)}`;

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

          {/* Informações */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold leading-tight">{ad.title}</h1>
            <div className="text-emerald-400 text-2xl font-extrabold">
              {formatPriceBRL(ad.priceCents)}
            </div>

            {expiresText && (
              <div className="text-sm text-amber-400/90">⏳ {expiresText}</div>
            )}

            {ad.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {ad.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
              >
                Falar no WhatsApp
              </a>

              <ShareButton
                url={pageUrl}
                title={shareTitle}
                text={shareText}
                className="inline-flex w-full items-center justify-center rounded-md border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              />
            </div>

            {center && (
              <div className="pt-2 text-xs text-muted-foreground">
                {ad.city && ad.uf ? `${ad.city} - ${ad.uf}` : null}
              </div>
            )}
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
